import { Resolver, Query, Mutation, Arg, Field, ObjectType, Ctx } from 'type-graphql';
import { User } from './entity/User';
import { hash, compare } from 'bcrypt';
import { sign } from 'jsonwebtoken';
import { MyContext } from './MyContext';

@ObjectType() 
class LoginResponse {
  @Field()
  accessToken: string
}

@Resolver()
export class UserResolver {
  @Query(() => String)
  hello() {
    return "Hi there!";
  }

  @Query(() => [User])
  users() {
    return User.find();
  }

  @Mutation(() => Boolean)
  async register(
    @Arg('email') email: string,
    @Arg('password') password: string
  ) {
    const hashedPassword = await hash(password, 12);
    try {
      await User.insert({
        email,
        password: hashedPassword
      });
      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  }


  @Mutation(() => LoginResponse)
  async login(
    @Arg('email') email: string,
    @Arg('password') password: string,
    @Ctx() { res }: MyContext
  ): Promise<LoginResponse> {
    const user = await User.findOne({
      where: {
        email
      }
    });

    if (!user) {
      throw new Error('Could not find a user');
    } else {
      const valid = await compare(password, user.password);

      if (!valid) {
        throw new Error("Bad password");
      } else { 
        res.cookie('jid', sign({ userId: user.id }, 'different_secret', {
          expiresIn: '7d'
        }), {
          httpOnly: true
        });

        return {
          accessToken: sign({
            userId: user.id
          }, 'some_secret', {
            expiresIn: '15m'
          }) 
        }
      }
    }
  }
}