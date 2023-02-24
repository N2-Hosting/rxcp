import { schema } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Product from 'App/Models/Shop/Product'
import {
  descriptionRules,
  priceRules,
  slugRules,
  statusRules,
  titleRules,
} from 'App/Validations/product'
import cacheData, { purgeCache } from 'App/Services/cacheData'

export default class ProductsController {
  private cachePrefix = 'products'

  /**
   * Product list
   */
  public async index({ request, response, bouncer }: HttpContextContract) {
    await bouncer.with('RolePolicy').authorize('permission', 'api::shop::products.index')
    const page = request.input('page', 1)
    const limit = request.input('limit', 10)
    const requestQs = request.qs()
    const qs = JSON.stringify(requestQs)
    const cacheKey = qs !== '{}' ? `${this.cachePrefix}:${qs}` : this.cachePrefix

    return await cacheData(cacheKey)(response)(async () => {
      return await Product.query().preload('user').filter(requestQs).paginate(page, limit)
    })
  }

  /**
   * Show product details
   */
  public async show({ params, response, bouncer }: HttpContextContract) {
    await bouncer.with('RolePolicy').authorize('permission', 'api::shop::products.show')

    const data = await cacheData(`${this.cachePrefix}:${params?.id}`)(response)(async () => {
      return await Product.find(params?.id)
    })

    return {
      data,
    }
  }

  /**
   * Create Product
   */
  public async create({ auth, request, response, bouncer }: HttpContextContract) {
    await bouncer.with('RolePolicy').authorize('permission', 'api::shop::products.create')
    const payload = request.only(['title', 'description', 'slug', 'status', 'price'])

    const userId = auth.use('api').user?.id

    // Validation
    const createProductSchema = schema.create({
      title: titleRules,
      description: descriptionRules,
      slug: slugRules(),
      status: statusRules,
      price: priceRules,
    })

    await request.validate({ schema: createProductSchema })

    try {
      const product = await Product.create({
        title: payload.title,
        description: payload.description,
        slug: payload.slug,
        status: payload.status,
        price: payload.price,
        user_id: userId,
      })

      await this.purgeCache()

      return product
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
   * Archive product
   */
  public async archive({ params, response, bouncer }: HttpContextContract) {
    await bouncer.with('RolePolicy').authorize('permission', 'api::shop::products.archive')

    try {
      const product = await Product.findOrFail(params?.id)
      await product.delete()
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

  /**
   * Archived products
   */
  public async archived({ request, bouncer }: HttpContextContract) {
    await bouncer.with('RolePolicy').authorize('permission', 'api::shop::products.archived')

    const page = request.input('page', 1)
    const limit = request.input('limit', 10)

    return await Product.query().onlyTrashed().filter(request.qs()).paginate(page, limit)
  }

  /**
   * Restore product from archived
   */
  public async restore({ request, response, bouncer }: HttpContextContract) {
    await bouncer.with('RolePolicy').authorize('permission', 'api::shop::products.restore')
    const payload = request.only(['product_id'])

    try {
      const product = await Product.withTrashed().where('id', payload.product_id).firstOrFail()
      await product.restore()
      return product
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
   * Clear one product cache
   */
  public async clearOneCache({ response, params, bouncer }: HttpContextContract) {
    await bouncer.with('RolePolicy').authorize('permission', 'api::shop::products.clearCache')
    await this.purgeCache(params?.id)

    return response.noContent()
  }

  /**
   * Clear products cache
   */
  public async clearAllCache({ bouncer, response }: HttpContextContract) {
    await bouncer.with('RolePolicy').authorize('permission', 'api::shop::products.clearCache')
    await this.purgeCache()

    return response.noContent()
  }

  /**
   * Clear cache
   */
  private async purgeCache(id?: string) {
    purgeCache(id ? `${this.cachePrefix}:${id}` : `${this.cachePrefix}*`)
  }
}