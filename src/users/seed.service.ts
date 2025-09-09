/*
===========================================================================
  Servicio que se ejecuta al iniciar el backend para gestionar la creación 
  de los permisos, roles básicos y el administrador
  Para todos verifica si ya se han creado para evitar duplicación
===========================================================================
*/


import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../entities/user.entity';
import { RoleEntity } from '../entities/roles.entity';
import { PermissionEntity } from '../entities/permissions.entity';
import { hashSync } from 'bcrypt';

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(

    //INYECCIONES DE DEPENDENCIAS

    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,

    @InjectRepository(RoleEntity)
    private readonly roleRepo: Repository<RoleEntity>,

    @InjectRepository(PermissionEntity)
    private readonly permissionRepo: Repository<PermissionEntity>,
  ) {}


  //Se ejecuta al iniciar el servicio
  async onModuleInit() {
    const permissions = await this.createPermissions(); //Crea los permisos
    await this.seedRoles(permissions); //Crea los roles principales
    await this.seedSupervisor(); //Crea el usuario administrador
  }


  //CREACIÓN DE LOS PERMISOS
  async createPermissions() {
      const allPermissions = [
      'create_user',
      'create_roles',
      'create_permissions',
      'update_user',
      'update_roles',
      'update_permissions',
      'delete_user',
      'delete_roles',
      'delete_permissions',
      'list_users',
      'list_roles',
      'list_permissions',
      'create_venta',
      'update_venta',
      'delete_venta',
      'list_ventas',
      'create_compra',
      'update_compra',
      'delete_compra',
      'list_compras',
      'ver_dashboard',
      'update_stock'
    ];

    //Crea y carga los servicios en la base de datos si aún no han sido creados
    const createdPermissions = await Promise.all(
      allPermissions.map(async (name) => {
        //Busca todos los permisos, y si no los encuentra, los crea y los guarda en la BD
        let permission = await this.permissionRepo.findOneBy({ name });
        if (!permission) {
          permission = this.permissionRepo.create({ name });
          await this.permissionRepo.save(permission);
        }
        return permission;
      }),
    );
    //Retorna los permisos creados
    return createdPermissions;
  }

  //CREACIÓN DE ROLES BÁSICOS
  async seedRoles(permissions: PermissionEntity[]){
    // Definir roles y sus permisos

    //Permisos del rol Usuario / User
    const vendedorPermissions = [
      'create_venta',
      'update_venta',
      'delete_venta',
      'list_ventas',
      'update_user'
    ]

    const encargadoComprasPermissions = [
      'create_compra',
      'update_compra',
      'delete_compra',
      'list_compras',
      'update_user'
    ]

    const rolesConfig = [
      {
        name: 'Supervisor',
        permissions: permissions, // El supervisor tiene todos los permisos
      },
      {
        name: 'Vendedor',
        permissions: permissions.filter(p => vendedorPermissions.includes(p.name))
      },
      {
        name: 'Encargado de Compras',
        permissions: permissions.filter(p => encargadoComprasPermissions.includes(p.name))
      }
    ]

    // Crear cada rol
    for (const roleConfig of rolesConfig) {
      //Busca roles en la BD que coincidan con los que se quieren crear
      let role = await this.roleRepo.findOne({
        where: { name: roleConfig.name },
        relations: ['permissions'],
      });

      //Si no los encuentra, los crea y los guarda en la BD
      if (!role) {
        role = this.roleRepo.create({
          name: roleConfig.name,
          permissions: roleConfig.permissions
        });

        await this.roleRepo.save(role);
        
        console.log(`Rol '${roleConfig.name}' creado con éxito`); //DEBUG

      } else {
        // Actualizar permisos si el rol ya existe
        const existingPermissionNames = role.permissions.map(p => p.name); //Permisos que tiene el rol creado
        const expectedPermissionNames = roleConfig.permissions.map(p => p.name); //Permisos que tiene el roleConfig (plantilla)
        
        // Verificar si faltan permisos o sobran
        const missingPermissions = roleConfig.permissions.filter(
          p => !existingPermissionNames.includes(p.name) //Permisos del rolConfig que no estan en el rol creado
        );
        
        //Si faltan o sobran permisos, se vuelven a cargar los permisos desde el rolConfig.
        if (missingPermissions.length > 0 || 
            existingPermissionNames.length !== expectedPermissionNames.length) {
          role.permissions = roleConfig.permissions;
          await this.roleRepo.save(role);
          console.log(`Permisos actualizados para rol '${roleConfig.name}'`); //DEBUG
        }
      }
    }
  }



  //CREACIÓN DE USUARIO ADMINISTRADOR
  async seedSupervisor() {

    //Busca el rol 'admin' en la BD
    let supervisorRole = await this.roleRepo.findOneBy({name: 'Supervisor'});


    //Si no lo encuentra no crea el usuario
    if (!supervisorRole) {
      console.log('Error: Rol supervisor no encontrado.') //DEBUG
      return;
    }

    //Busca un usuario en la BD que coincida con el parámetro
    let supervisorUser = await this.userRepo.findOneBy({ email: 'admin@example.com' });
    //Si no lo encuentra, lo crea y lo guarda en la BD
    if (!supervisorUser) {
      supervisorUser = this.userRepo.create({
        //Atributos de la entidad
        nombreUsuario: 'manubernardi',
        email: 'admin@example.com',
        password: hashSync('123456', 10), //Password encriptada
        roles: [supervisorRole],
      });
      await this.userRepo.save(supervisorUser);

      console.log('✅ Usuario Supervisor creado'); //DEBUG

    } else {
      console.log('⚠️ Usuario Supervisor ya existía'); //DEBUG
    }
  }
}