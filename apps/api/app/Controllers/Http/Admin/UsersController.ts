import { schema } from '@ioc:Adonis/Core/Validator'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import User from 'App/Models/User'
import { emailRules, firstNameRules, lastNameRules, passwordRules } from 'App/validations/user'

export default class UsersController {
  /**
   * Users list
   */
  public async index({ request, bouncer }: HttpContextContract) {
    await bouncer.with('RolePolicy').authorize('permission', 'api::users.index')

    const page = request.input('page', 1)
    const limit = 10
    const users = await User.query().paginate(page, limit)
    return users.serialize()
  }

  /**
   *User details
   */
  public async show({ params, bouncer }: HttpContextContract) {
    await bouncer.with('RolePolicy').authorize('permission', 'api::users.show')

    return {
      data: await User.find(params?.id),
    }
  }

  /**
   * Create user
   */
  public async create({ request, response, bouncer }: HttpContextContract) {
    await bouncer.with('RolePolicy').authorize('permission', 'api::users.create')
    const payload = request.only(['first_name', 'last_name', 'email', 'password'])

    // Validation
    const updateUserSchema = schema.create({
      first_name: firstNameRules,
      last_name: lastNameRules,
      email: emailRules(),
      password: passwordRules(),
    })

    await request.validate({ schema: updateUserSchema })

    try {
      const user = await User.create({
        first_name: payload.first_name,
        last_name: payload.last_name,
        email: payload.email,
        password: payload.password,
      })

      return user
    } catch (e) {
      return response.badRequest({
        errors: [
          {
            message: e.toString(),
          },
        ],
      })
    }
  }

  /**
   * Update user
   */
  public async update({ request, params, response, bouncer }: HttpContextContract) {
    await bouncer.with('RolePolicy').authorize('permission', 'api::users.update')
    const payload = request.only(['first_name', 'last_name', 'email', 'password'])
    let validationSchema = {
      first_name: firstNameRules,
      last_name: lastNameRules,
      email: emailRules(params?.id),
    }

    if (payload.password) {
      validationSchema = {
        ...validationSchema,
        ...{ password: passwordRules() },
      }
    }

    // Validation
    const updateUserSchema = schema.create(validationSchema)

    await request.validate({ schema: updateUserSchema })

    try {
      const user = await User.findOrFail(params?.id)
      const results = await user
        .merge({
          first_name: payload.first_name,
          last_name: payload.last_name,
          email: payload.email,
          password: payload.password,
        })
        .save()

      return results
    } catch (e) {
      return response.badRequest({
        errors: [
          {
            message: e.toString(),
          },
        ],
      })
    }
  }

  /**
   * Delete user
   */
  public async destroy({ params, response, bouncer }: HttpContextContract) {
    await bouncer.with('RolePolicy').authorize('permission', 'api::users.destroy')

    try {
      const user = await User.findOrFail(params?.id)
      await user.delete()
      return response.noContent()
    } catch (e) {
      return response.badRequest({
        errors: [
          {
            message: e.toString(),
          },
        ],
      })
    }
  }
}