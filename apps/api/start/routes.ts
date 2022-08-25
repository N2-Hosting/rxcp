/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| This file is dedicated for defining HTTP routes. A single file is enough
| for majority of projects, however you can define routes in different
| files and just make sure to import them inside this file. For example
|
| Define routes in following two files
| ├── start/routes/cart.ts
| ├── start/routes/customer.ts
|
| and then import them inside `start/routes.ts` as follows
|
| import './routes/cart'
| import './routes/customer'
|
*/

import HealthCheck from '@ioc:Adonis/Core/HealthCheck'
import Route from '@ioc:Adonis/Core/Route'

Route.get('/', ({ view }) => {
  return view.render('home')
})

// Global scope, both admin and client
Route.group(() => {
  // Guest
  Route.post('login', 'AuthController.login')
  Route.post('register', 'AuthController.register')
  Route.post('logout', async ({ auth }) => {
    await auth.use('api').revoke()
    return {
      revoked: true,
    }
  })
  // Health check
  Route.get('health', async ({ response }) => {
    const report = await HealthCheck.getReport()

    return report.healthy ? response.ok(report) : response.badRequest(report)
  })

  // Authenticated
  Route.group(() => {
    // Me
    Route.get('me', ({ auth }) => {
      return {
        data: auth.use('api').user,
      }
    })
    Route.patch('me', 'UserController.patch')
    Route.put('me/update-email', 'UserController.updateEmail')
    Route.put('me/change-password', 'UserController.changePass')
  }).middleware('auth')
}).prefix('/api')

// Client
Route.group(() => {
  // Ragnarok server
  Route.get('server', 'ServerController.index')
  Route.get('server/info', 'ServerController.index')
}).prefix('/api')

// Admin
Route.group(() => {
  // Authenticated routes
  Route.group(() => {
    // Users
    Route.get('users', 'UsersController.index')
    Route.get('users/:id', 'UsersController.show')
    // Roles
    Route.get('roles', 'RolesController.index')
    Route.get('roles/:id/permissions', 'RolesController.getPermissions')
    // Permissions
    Route.get('permissions', 'PermissionsController.index')
    // Accounts
    Route.get('accounts', 'AccountsController.index')
    Route.get('accounts/:id', 'AccountsController.show')
    Route.get('accounts/:id/characters', 'AccountsController.getCharacters')
    Route.post('accounts', 'AccountsController.create')
    Route.put('accounts/:id', 'AccountsController.update')
    Route.delete('accounts/:id', 'AccountsController.destroy')
    // Characters
    Route.get('characters', 'CharactersController.index')
    Route.get('characters/:id', 'CharactersController.show')
    Route.get('characters/:id/account', 'CharactersController.getAccount')
    // Guilds
    Route.get('guilds', 'GuildsController.index')
    Route.get('guilds/:id', 'GuildsController.show')
  }).prefix('/api')
})
  .prefix('/admin')
  .middleware('auth')