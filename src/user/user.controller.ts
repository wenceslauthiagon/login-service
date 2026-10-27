import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
  DefaultValuePipe,
  ParseIntPipe,
  ForbiddenException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { IsPublic } from 'src/auth/decorators/is-public.decorator';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { AuthenticatedUser } from 'src/auth/interfaces/authenticated-user.interface';
import { createDomainResponse } from 'src/common/responses/domain-response';

@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @IsPublic()
  @ApiOperation({ summary: 'Criar uma conta de usuário' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    schema: {
      example: {
        users: {
          metadados: { domains: ['users'], api_version: '1.0' },
          data: { id: 'user-id', name: 'User', email: 'user@example.com' },
          message: 'Usuário criado com sucesso',
        },
      },
    },
  })
  async create(@Body() data: CreateUserDto) {
    return createDomainResponse(
      'users',
      await this.userService.create(data),
      'Usuário criado com sucesso',
    );
  }

  @Get()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Listar usuários ativos' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 0 })
  @ApiQuery({ name: 'pageSize', required: false, type: Number, example: 10 })
  @ApiResponse({
    status: HttpStatus.OK,
    schema: {
      example: {
        users: {
          metadados: { domains: ['users'], api_version: '1.0' },
          data: [],
          pagination: { page: 0, pageSize: 10, totalPages: 0, totalRecords: 0 },
          message: 'Usuários buscados com sucesso',
        },
      },
    },
  })
  async findAll(
    @Query('page', new DefaultValuePipe(0), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(10), ParseIntPipe)
    pageSize: number,
  ) {
    const result = await this.userService.findAll(page, pageSize);

    return createDomainResponse(
      'users',
      result.data,
      'Usuários buscados com sucesso',
      {
        page: result.page,
        pageSize: result.pageSize,
        totalPages: result.totalPages,
        totalRecords: result.totalRecords,
      },
    );
  }

  @Get(':id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Buscar um usuário pelo ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    schema: {
      example: {
        users: {
          metadados: { domains: ['users'], api_version: '1.0' },
          data: { id: 'user-id', email: 'user@example.com', name: 'User' },
          message: 'User buscado com sucesso',
        },
      },
    },
  })
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return createDomainResponse(
      'users',
      await this.userService.findById(id),
      'User buscado com sucesso',
    );
  }

  @Patch(':id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Atualizar um usuário pelo ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    schema: {
      example: {
        users: {
          metadados: { domains: ['users'], api_version: '1.0' },
          data: { id: 'user-id', email: 'user@example.com', name: 'Updated User' },
          message: 'Usuário atualizado com sucesso',
        },
      },
    },
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: UpdateUserDto,
  ) {
    return createDomainResponse(
      'users',
      await this.userService.update(id, data),
      'Usuário atualizado com sucesso',
    );
  }

  @Delete(':id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Desativar um usuário pelo ID' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'User deactivated. The response has no content.',
  })
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    if (id === currentUser.id) {
      throw new ForbiddenException('You cannot deactivate your own account');
    }

    await this.userService.remove(id);
  }
}
