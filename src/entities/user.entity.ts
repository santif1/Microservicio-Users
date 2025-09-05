import { UserI } from '../interfaces/user.interface';
import { BaseEntity, Column, Entity, Index, JoinTable, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { RoleEntity } from './roles.entity';

@Entity('users')
export class UserEntity extends BaseEntity implements UserI {
  @PrimaryGeneratedColumn()
  id: number;
  @Index({unique:true})
  @Column()
  email: string;
  @Column()
  password: string;

  // Relación n a n con la tabla roles (tabla intermedia)
  @ManyToMany(()=> RoleEntity, role => role.users, { eager: true })
  @JoinTable({name: 'users_roles'})
  roles: RoleEntity[];


  //Getter para obtener los permisos del usuario (según su rol)
  //Evita una relación directa con los permisos
  get permissionCodes() {
    return this.roles.flatMap(role => role.permissions.map(p => p.name));
  }

}
