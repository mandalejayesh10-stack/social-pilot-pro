import { IsString, IsOptional, IsBoolean, IsNumber, IsArray, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GenerateCaptionDto {
  @ApiProperty({ example: 'instagram' })
  @IsString()
  platform: string;

  @ApiProperty({ example: 'New product launch for our fitness app' })
  @IsString()
  topic: string;

  @ApiPropertyOptional({ example: 'professional' })
  @IsOptional()
  @IsString()
  tone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  includeHashtags?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  maxLength?: number;
}

export class SuggestHashtagsDto {
  @ApiProperty()
  @IsString()
  platform: string;

  @ApiProperty()
  @IsString()
  content: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  niche?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  count?: number;
}

export class ChatDto {
  @ApiProperty()
  @IsString()
  message: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  platform?: string;

  @ApiPropertyOptional({ type: [Object] })
  @IsOptional()
  @IsArray()
  conversationHistory?: Array<{ role: string; content: string }>;
}
