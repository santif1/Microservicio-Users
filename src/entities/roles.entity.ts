import { Column, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { UserEntity } from './user.entity';
import { PermissionEntity } from './permissions.entity';

@Entity('roles')
export class RoleEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    // Relación n a n con la tabla users (tabla intermedia)
    @ManyToMany(()=> UserEntity, user => user.roles)
    users: UserEntity[];

    // Relación n a n con la tabla permissions (tabla intermedia)
    @ManyToMany(()=> PermissionEntity, permission => permission.roles, { eager: true })
    @JoinTable({ name: 'roles_permissions' })
    permissions: PermissionEntity[];

}