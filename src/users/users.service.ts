import {
  HttpException,
  Injectable,
  NotFoundException,
  UnauthorizedException
} from '@nestjs/common';
import { LoginDTO } from 'src/interfaces/login.dto';
import { RegisterDTO } from 'src/interfaces/register.dto';
import { UserEntity } from '../entities/user.entity';
import { hashSync, compareSync } from 'bcrypt';
import { JwtService } from 'src/jwt/jwt.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not } from 'typeorm';
import { RoleEntity } from '../entities/roles.entity'; 
import { UpdateUserProfileDto } from 'src/interfaces/updateuser.dto'; 

@Injectable()
export class UsersService {

  constructor(

    //INYECIÓN DE DEPENDENCIAS

    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private jwtService: JwtService,
    @InjectRepository(RoleEntity)
    private readonly roleRepository: Repository<RoleEntity>
  ) {}


  //Retorna todos los usuarios
  async findAll(): Promise<UserEntity[]> {
    return await this.userRepository.find({})
  }


  //Busca un usuario por email
  async findByEmail(email: string): Promise<UserEntity> {
    return await this.userRepository.findOneBy({ email }); // Retorna el usuario encontrado
  }


  //Renovación del token
  async refreshToken(refreshToken: string) {
    //Le asigna la responsabilidad al jwtService
    return this.jwtService.refreshToken(refreshToken);
  }


  //Valida si un usuario posee un permiso determinado
  canDo(permissions: string[], permission: string): boolean {
    //Obtiene los permisos del usuario
    //Si el usuario no tiene permisos, lanza una excepción (No autorizado)
    if (!permissions || permissions.length === 0) {
      throw new UnauthorizedException();
    }

    //Si no tiene el permiso requerido, lanza una excepción (No autorizado)
    if (!permissions.includes(permission)) {
      throw new UnauthorizedException();
    }

    return true; //True si el usuario tiene el permiso requerido
  }


  //Gestión del registro de un nuevo usuario (create)
  async register(body: RegisterDTO) {
    try {

      const user = new UserEntity(); //Nueva instancia de la entidad User

      Object.assign(user, body); //Asigna al nuevo usuario los datos enviados en el body del registro

      user.password = hashSync(user.password, 10); //Hashea la contraseña


      //Busca el rol 'usuario'
      const userRole = await this.roleRepository.findOne({
        where: {name: 'user'},
        relations: ['permissions'],
      });

      //Si no lo encuentra, lanza un error
      if (!userRole) throw new Error('Rol usuario no encontrado.');

      //Asigna este rol al nuevo usuario
      user.roles = [userRole];

      // Guarda el usuario en la BD 
      const savedUser =await this.userRepository.save(user);

      const payload = { sub: savedUser.id, email: savedUser.email, permissions: savedUser.permissionCodes }; //Cuerpo de la petición (Datos del usuario)
      //sub = id/primary key

      //Generación de tokens. Asigna la responsabilidad al jwtService
      const accessToken = this.jwtService.generateToken(payload, 'auth'); //Token de acceso
      const refreshToken = this.jwtService.generateToken(payload, 'refresh'); //Token de refresco o renovación
      

      //Respuesta de la petición (POST)
      return {
        status: 'created',
        message: 'Usuario registrado correctamente',
        accessToken,
        refreshToken,
        user: {
          id: savedUser.id,
          email: savedUser.email,
        }
      };
        
    } catch (error) { //Manejo de errores
      console.error(error);
      throw new HttpException('Error de creacion' + error.message, 500);
    }
  }


  //Gestión del logueo (Autenticación)
  async login(body: LoginDTO) {

    //Busca el usuario por email
    const user = await this.findByEmail(body.email);

    //Si no lo encuentra, lanza una excepción 
    if (user == null) {
      throw new UnauthorizedException();
    }

    //Compara la contraseña enviada en el login con la guardada en la BD
    const compareResult = compareSync(body.password, user.password);

    //Si no coinciden, lanza una excepción
    if (!compareResult) throw new UnauthorizedException();
    
    //Respuesta de la petición (POST)
    return {

      //Generación de tokens
      accessToken: this.jwtService.generateToken({ 
        email: user.email, 
        sub: user.id,
        permissions: user.permissionCodes }, 'auth'),
      refreshToken: this.jwtService.generateToken({ 
        email: user.email,
        sub: user.id,
        permissions: user.permissionCodes 
      },'refresh'),
      //Datos del usuario
      user: {
      id: user.id,
      email: user.email,
    }
    };
  }

  //Asignar un nuevo rol a un usuario
  async assignRole(id: number, roleIds: number[]): Promise<string> {

    //Busca al usuario por su id
    const user = await this.userRepository.findOneBy({ id });

    //Si no lo encuentra, lanza un error
    if (!user) throw new NotFoundException(`User with id ${id} not found`);

    //Busca todos los roles que se quieran asignar, por sus ids
    const roles = await this.roleRepository.findBy({ id: In(roleIds) });

    //Añade los roles a los que ya tenía el usuario
    user.roles = [...user.roles, ...roles];

    //Guarda la modificación
    await this.userRepository.save(user);

    return 'Rol asignado con éxito';
  }


  //Modifica los datos de un usuario
  async updateProfile(userId: number, updateProfileDto: UpdateUserProfileDto): Promise<UserEntity> {

    //El dto tiene los atributos que se deben cambiar del usuario. Pueden ser los dos o uno solo
    
    //Busca al usuario por su id
    const user = await this.userRepository.findOneBy({id: userId});

    //Si no lo encuentra, lanza un error
    if (!user) throw new Error('Usuario no encontrado');

    // Actualizar campos si están presentes
    if (updateProfileDto.email) {
      user.email = updateProfileDto.email;
    }

    if (updateProfileDto.password) {
      // Hashear la nueva contraseña
      user.password = hashSync(updateProfileDto.password, 10);
    }

    // Guardar cambios
    const updatedUser = await this.userRepository.save(user);

    console.log('✅ Usuario actualizado exitosamente'); //DEBUG
    
    return updatedUser; 
  }


  //Valida si existe el email enviado en la peticion
  async checkEmailExists(email: string, excludeUserId?: number): Promise<boolean> {

    //Condición de validación
    const whereCondition: any = { email };
    
    //Si se quiere excluir algún usuario
    if (excludeUserId) {
      whereCondition.id = Not(excludeUserId);
    }

    //Busca un usuario que cumpla con la condición
    const user = await this.userRepository.findOne({ where: whereCondition });

    //Si existe el usuario, retorna true, sino retorna false
    return !!user;
  }
  
}
