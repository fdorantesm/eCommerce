import db from 'config/database'
import i18n from 'i18n-2'
import jwt from 'jsonwebtoken'
import middlewares from 'config/middlewares'
import mongoose from 'mongoose'
import translation from 'config/i18n'

export default (app) => {

		app.set('view engine', process.env.APP_VIEWS_ENGINE || 'pug')
		app.set('views', process.env.APP_VIEWS)
		app.set('env', process.env)
		app.set('secret', process.env.APP_SECURE_KEY)
		app.set('salt', process.env.APP_SECURE_SALT)
		app.set("x-powered-by", process.env.APP_EXPOSE)
		app.set('jwt', jwt)
		app.set('token_expires', process.env.APP_SECURE_EXPIRATION)
		
		mongoose.connect(db().uri, db().config)

		i18n.expressBind(app, translation)

		switch (process.env.ENV === 'local') {
			case 'local':
				process.env.CONEKTA_PUBLIC = CONEKTA_TEST_PUBLIC
				process.env.CONEKTA_PRIVATE = CONEKTA_TEST_PRIVATE
				process.env.PAYPAL_PUBLIC = PAYPAL_TEST_PUBLIC
				process.env.PAYPAL_PRIVATE = PAYPAL_TEST_PRIVATE
			break;
			
			case 'test':
				process.env.CONEKTA_PUBLIC = CONEKTA_TEST_PUBLIC
				process.env.CONEKTA_PRIVATE = CONEKTA_TEST_PRIVATE
				process.env.PAYPAL_PUBLIC = PAYPAL_TEST_PUBLIC
				process.env.PAYPAL_PRIVATE = PAYPAL_TEST_PRIVATE
			break;

			case 'production':
				process.env.CONEKTA_PUBLIC = CONEKTA_LIVE_PUBLIC
				process.env.CONEKTA_PRIVATE = CONEKTA_LIVE_PRIVATE
				process.env.PAYPAL_PUBLIC = PAYPAL_LIVE_PUBLIC
				process.env.PAYPAL_PRIVATE = PAYPAL_LIVE_PRIVATE
			break;

		}

		middlewares(app)

	return app
}
