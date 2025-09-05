import { Injectable, NotFoundException } from '@nestjs/common';
import { RoleEntity } from '../entities/roles.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { createRoleDto } from 'src/interfaces/createRoleDto';
import { PermissionEntity } from '../entities/permissions.entity';
import { UserEntity } from '../entities/user.entity';
import { Mensaje } from '../interfaces/mensajeInterface';


@Injectable()
export class RolesService {

  //Constructor que inyecta los repositorios de las entidades necesarias
  constructor(
    @InjectRepository(RoleEntity)
    private readonly roleRepository: Repository<RoleEntity>, //Repositorio para la entidad Role

    @InjectRepository(PermissionEntity)
    private readonly permissionRepository: Repository<PermissionEntity>, //Repositorio para la entidad Permission

    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>, //Repositorio para la entidad User
  ) {}


  // Crea un nuevo rol con permisos y usuarios asignados
  async create(dto: createRoleDto): Promise<RoleEntity> {
    // Si se reciben IDs de permisos, los busca en la BD; si no, asigna un array vacío
    const permissions = dto.permissionIds
      ? await this.permissionRepository.findBy({ id: In(dto.permissionIds) })
      : [];

    // Si se reciben IDs de usuarios, los busca en la BD; si no, asigna un array vacío
    const users = dto.userIds
      ? await this.userRepository.findBy({ id: In(dto.userIds) })
      : [];

    // Crea una nueva instancia de Role con nombre, permisos y usuarios
    const role = this.roleRepository.create({
      name: dto.name,
      permissions,
      users,
    });

    // Guarda el rol en la BD
    return await this.roleRepository.save(role);
  }

  // Devuelve todos los roles registrados
  async findAll(): Promise<RoleEntity[]> {
    return await this.roleRepository.find({});
  }

  // Busca y devuelve un rol por su ID. Lanza un error si no lo encuentra.
  async findOne(id: number): Promise<RoleEntity> {
    const role = await this.roleRepository.findOneBy({ id: Number(id) });

    if (!role) {
      throw new Error(`Role with id ${id} not found`);
    }

    return role;
  }

  // Agrega permisos a un rol existente
  async addPermissions(roleId: number, permissionIds: number[]): Promise<RoleEntity> {
    // Busca el rol por ID
    const role = await this.roleRepository.findOneBy({ id: roleId });

    // Si no existe, lanza una excepción
    if (!role) throw new NotFoundException(`Role con id ${roleId} no existe.`);

    // Busca los permisos por ID
    const permissions = await this.permissionRepository.findBy({ id: In(permissionIds) });

    // Agrega los permisos nuevos a los ya existentes
    role.permissions = [...role.permissions, ...permissions];

    // Guarda el rol actualizado
    return await this.roleRepository.save(role);
  }

  // Elimina un rol por su ID
  async remove(id: number): Promise<Mensaje> {
    // Ejecuta la operación de borrado
    const result = await this.roleRepository.delete(id);

    // Si no se afectó ninguna fila, significa que el rol no existía
    if (result.affected === 0) throw new Error(`Rol con id ${id} no se encontró.`);

    // Devuelve un mensaje personalizado de éxito
    const mensaje = new Mensaje('Deleted');
    return mensaje;
  }
}
