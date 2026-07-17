import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { KanbamService } from '../kanbam/kanbam.service';
import type { ColumnResponseDto } from '../kanbam/dto/column-response.dto';
import type { TaskResponseDto } from '../kanbam/dto/task-response.dto';
import type { ChatResponseDto } from './dto/chat-response.dto';

const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

interface GeminiTaskPayload {
  title?: string;
  description?: string | null;
  columnTitle?: string;
}

interface GeminiParsedResponse {
  action?: string;
  message?: string;
  task?: GeminiTaskPayload;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly kanbamService: KanbamService,
  ) {}

  async chat(userId: number, message: string): Promise<ChatResponseDto> {
    const columns = await this.kanbamService.findAllColumns(userId);
    if (columns.length === 0) {
      throw new BadRequestException('Nenhuma coluna encontrada no quadro.');
    }

    const parsed = await this.callGemini(message, columns);

    if (parsed.action === 'CREATE_TASK') {
      return this.handleCreateTask(userId, parsed, columns);
    }

    return {
      action: 'CHAT',
      message: this.nonEmptyString(parsed.message) ?? 'Como posso ajudar com suas tarefas?',
    };
  }

  private async handleCreateTask(
    userId: number,
    parsed: GeminiParsedResponse,
    columns: ColumnResponseDto[],
  ): Promise<ChatResponseDto> {
    const title = parsed.task?.title?.trim();
    if (!title) {
      throw new BadRequestException('A IA não conseguiu extrair um título válido para a tarefa.');
    }

    const columnId = this.resolveColumnId(parsed.task?.columnTitle, columns);
    const description = this.nonEmptyString(parsed.task?.description);

    const task: TaskResponseDto = await this.kanbamService.createTask(userId, {
      title,
      description,
      columnId,
    });

    const columnTitle = columns.find((column) => column.id === columnId)?.title ?? 'coluna';

    return {
      action: 'CREATE_TASK',
      message:
        this.nonEmptyString(parsed.message) ??
        `Tarefa "${task.title}" criada com sucesso na coluna ${columnTitle}.`,
      task,
    };
  }

  private resolveColumnId(columnTitle: string | undefined, columns: ColumnResponseDto[]): number {
    if (!columnTitle?.trim()) {
      return columns[0].id;
    }

    const normalizedInput = this.normalizeText(columnTitle);

    const exactMatch = columns.find(
      (column) => this.normalizeText(column.title) === normalizedInput,
    );
    if (exactMatch) return exactMatch.id;

    const partialMatch = columns.find((column) => {
      const normalizedColumn = this.normalizeText(column.title);
      return (
        normalizedColumn.includes(normalizedInput) || normalizedInput.includes(normalizedColumn)
      );
    });
    if (partialMatch) return partialMatch.id;

    const aliasMatch = this.matchColumnAlias(normalizedInput, columns);
    if (aliasMatch) return aliasMatch.id;

    throw new BadRequestException(
      `Coluna "${columnTitle}" não encontrada. Colunas disponíveis: ${columns.map((column) => column.title).join(', ')}.`,
    );
  }

  private matchColumnAlias(
    normalizedInput: string,
    columns: ColumnResponseDto[],
  ): ColumnResponseDto | undefined {
    const aliases: Record<string, string[]> = {
      backlog: ['backlog', 'pendente', 'pendentes', 'fila'],
      todo: ['todo', 'to do', 'a fazer', 'afazer', 'fazer'],
      doing: ['doing', 'em progresso', 'progresso', 'andamento', 'fazendo'],
      done: ['done', 'concluido', 'concluida', 'finalizado', 'finalizada', 'feito', 'feita'],
    };

    for (const [key, values] of Object.entries(aliases)) {
      if (!values.some((alias) => normalizedInput.includes(alias))) continue;

      const match = columns.find((column) => this.normalizeText(column.title).includes(key));
      if (match) return match;
    }

    return undefined;
  }

  private nonEmptyString(value: string | undefined | null): string | undefined {
    const trimmed = value?.trim();
    if (!trimmed) {
      return undefined;
    }
    return trimmed;
  }

  private normalizeText(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  private buildSystemPrompt(columns: ColumnResponseDto[]): string {
    const columnList = columns
      .map(
        (column) =>
          `- id=${String(column.id)}, title="${column.title}", order=${String(column.order)}`,
      )
      .join('\n');

    return `Você é um assistente de Kanban em português do Brasil.
Analise a mensagem do usuário e responda SOMENTE com JSON válido, sem markdown.

Colunas disponíveis do usuário:
${columnList}

Regras:
1. Se o usuário pedir para criar/adicionar/registrar uma tarefa, use action "CREATE_TASK".
2. Caso contrário, use action "CHAT" e responda de forma útil sobre o quadro.
3. Em CREATE_TASK, preencha task.title (obrigatório), task.description (opcional) e task.columnTitle com o nome exato ou equivalente de uma coluna listada.
4. Se a coluna não for mencionada, use "Backlog".
5. message deve ser uma resposta amigável em português.

Formato JSON obrigatório:
{
  "action": "CHAT" | "CREATE_TASK",
  "message": "string",
  "task": {
    "title": "string",
    "description": "string ou null",
    "columnTitle": "string"
  }
}`;
  }

  private async callGemini(
    message: string,
    columns: ColumnResponseDto[],
  ): Promise<GeminiParsedResponse> {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      throw new InternalServerErrorException('Chave da API Gemini não configurada.');
    }

    const body = {
      systemInstruction: {
        parts: [{ text: this.buildSystemPrompt(columns) }],
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: message }],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: 'application/json',
      },
    };

    let response: Response;

    try {
      response = await fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify(body),
      });
    } catch (error) {
      this.logger.error('Falha ao conectar com a API Gemini.', error);
      throw new BadGatewayException('Não foi possível conectar ao serviço de IA.');
    }

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(`Gemini API error (${String(response.status)}): ${errorText}`);
      throw new BadGatewayException('O serviço de IA retornou um erro. Tente novamente.');
    }

    const data = (await response.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };

    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      throw new BadGatewayException('Resposta inválida do serviço de IA.');
    }

    try {
      return JSON.parse(rawText) as GeminiParsedResponse;
    } catch {
      this.logger.error(`Falha ao parsear JSON da IA: ${rawText}`);
      throw new BadGatewayException('A IA retornou um formato inválido.');
    }
  }
}
