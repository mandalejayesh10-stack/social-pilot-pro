import {
  IsArray, IsString, IsOptional, IsDateString,
  IsNotEmpty, ArrayMinSize, IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePostDto {
  @ApiProperty({ description: 'Integration IDs to post to', type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  integrationIds: string[];

  @ApiProperty({ description: 'Post caption/content' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({ description: 'Media URLs', type: [String] })
  @IsOptional()
  @IsArray()
  mediaUrls?: string[];

  @ApiProperty({ description: 'ISO 8601 publish date' })
  @IsDateString()
  publishDate: string;

  @ApiPropertyOptional({ description: 'Hashtags string' })
  @IsOptional()
  @IsString()
  hashtags?: string;

  @ApiPropertyOptional({ description: 'Video title (YouTube)' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Platform-specific settings' })
  @IsOptional()
  @IsObject()
  settings?: Record<string, any>;
}

export class BulkScheduleDto {
  @ApiProperty({ type: [CreatePostDto] })
  @IsArray()
  @ArrayMinSize(1)
  posts: CreatePostDto[];
}

export class UpdatePostDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  mediaUrls?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  publishDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  hashtags?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  settings?: Record<string, any>;
}
