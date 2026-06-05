import { plainToInstance } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString, Min, validateSync } from 'class-validator';
import { Transform } from 'class-transformer';

class EnvironmentVariables {
  @IsString()
  @IsNotEmpty()
  DATABASE_URL!: string;

  @IsString()
  @IsNotEmpty()
  CORS_ORIGINS!: string;

  @IsString()
  @IsNotEmpty()
  JWT_ACCESS_SECRET!: string;

  @IsNumber()
  @Min(60)
  @Transform(({ value }: { value: string }) => parseInt(value, 10))
  JWT_ACCESS_EXPIRATION_SECONDS!: number;
}

export function validateEnv(config: Record<string, unknown>): EnvironmentVariables {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: false,
  });
  const errors = validateSync(validatedConfig, { skipMissingProperties: false });
  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validatedConfig;
}
