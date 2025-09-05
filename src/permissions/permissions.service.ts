import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PermissionEntity } from 'src/entities/permissions.entity';
import { RoleEntity } from 'src/entities/roles.entity';
import { createPermissionDto } from 'src/interfaces/createPermissionDto';
import { Repository, In } from 'typeorm';
import { Mensaje } from '../interfaces/mensajeInterface';

@Injectable()
// Servicio encargado de gestionar permisos dentro del sistema
export class PermissionsService {

    // Inyecta los repositorios necesarios para manejar permisos y roles
    constructor(
        @InjectRepository(PermissionEntity) // Inyecta el repositorio de la entidad PermissionEntity
        private readonly permissionRepository: Repository<PermissionEntity>,

        @InjectRepository(RoleEntity) // Inyecta el repositorio de la entidad RoleEntity
        private readonly roleRepository: Repository<RoleEntity>
    ) {}

    // Crea un nuevo permiso con roles asociados si se pasan
    async create(dto: createPermissionDto): Promise<PermissionEntity> {
        // Si se pasaron IDs de roles, los busca en la base de datos; si no, deja un arreglo vacío
        const roles = dto.roleIds
            ? await this.roleRepository.findBy({ id: In(dto.roleIds) }) // Busca los roles que tengan IDs en dto.roleIds
            : [];

        // Crea una nueva entidad de permiso con el nombre y los roles asociados
        const permission = this.permissionRepository.create({
            name: dto.name,
            roles: roles
        });
        
        // Guarda el permiso en la base de datos y lo devuelve
        return this.permissionRepository.save(permission);
    }

    // Devuelve todos los permisos almacenados en la base de datos
    async findAll(): Promise<PermissionEntity[]> {
        return await this.permissionRepository.find({});
    }

    // Busca un permiso por su ID
    async findOne(id: number): Promise<PermissionEntity> {
        const permission = await this.permissionRepository.findOneBy({ id });

        // Si no encuentra el permiso, lanza excepción
        if (!permission) {
            throw new NotFoundException(`Permiso con id ${id} no encontrado`);
        }

        return permission; // Devuelve el permiso si existe
    }

    // Elimina un permiso por ID y devuelve un mensaje
    async remove(id: number): Promise<Mensaje> {
        const result = await this.permissionRepository.delete({ id });

        // Si no se afectó ninguna fila, el permiso no existía
        if (result.affected === 0) {
            throw new Error(`Permiso con id ${id} no encontrado.`);
        }

        // Devuelve una instancia de Mensaje indicando que se eliminó
        const mensaje = new Mensaje('Deleted');
        return mensaje;
    }
}
