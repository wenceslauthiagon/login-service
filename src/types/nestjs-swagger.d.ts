declare module '@nestjs/swagger' {
  export function ApiProperty(opts?: any): PropertyDecorator;
  export function ApiPropertyOptional(opts?: any): PropertyDecorator;
  export function ApiTags(tag: string): ClassDecorator;
  export function ApiBearerAuth(name?: string): MethodDecorator & ClassDecorator;
  export function ApiBody(opts?: any): MethodDecorator;
  export function ApiOperation(opts?: {
    summary?: string;
    description?: string;
  }): MethodDecorator;
  export function ApiResponse(opts?: any): MethodDecorator;

  export class DocumentBuilder {
    setTitle(title: string): this;
    setDescription(desc: string): this;
    setVersion(version: string): this;
    addTag(name: string, description?: string): this;
    addBearerAuth(opts?: any, name?: string): this;
    build(): any;
  }

  export const SwaggerModule: {
    createDocument(app: any, config: any): any;
    setup(path: string, app: any, document: any): void;
  };

  export {
    ApiProperty,
    ApiPropertyOptional,
  } from '@nestjs/swagger/dist/decorators/api-property.decorator';
}
