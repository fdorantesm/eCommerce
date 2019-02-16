import { Types } from 'mongoose'
import { isArray, isObject } from 'lodash'
import Property from 'model/property'
import Profile from 'model/profile'
import User from 'model/user'
import File from 'model/file'
import Upload from 'library/upload'

export default class Properties {

	static async get (req, res) {
		
		let handler
		let filter = {}
		let response = {}
		let page
		const populate = [
			'address.country',
			'address.region',
			'address.city',
			'amenities',
			'category',
			'photos'
		]

		const profilePopulate = [
			{
				path: 'profile',
				model: 'Profile',
				populate: [
					{ path: 'address.country', model: 'Country' },
					{ path: 'address.region', model: 'Region' },
					{ path: 'address.city', model: 'City' }
				]
			}
		]

		const ownerPopulate = {
			path: 'owner',
			model: 'User',
			populate: profilePopulate
		}

		populate.push(ownerPopulate)
		
		if ('id' in req.params) {
			handler = Property
				.findById(req.params.id)
				.populate(populate)
		}

		else {
			page = parseInt(req.query.page) || 1

			if('category' in req.query) {
				filter.category = req.query.category
			}

			if ('keyword' in req.query) {
				const or = {
					$or : [
						{ 'title' : new RegExp(`.*${req.query.keyword}.*`, 'i') },
						{ 'description' : new RegExp(`.*${req.query.keyword}.*`, 'i') }
					]
				}
				filter = {...filter, ...or}
			}

			if('owner' in req.query) {
				let user = await User.findOne({nickname: req.query.owner})
				filter.owner = user ? user.id : null
			}

			handler = Property.paginate({ ...filter, ...{ deleted:false } }, {
				page: page, 
				limit: 12,
				populate,
				sort: {
					_id: -1
				}
			})

		}

		try {

			const result = await handler

			if (req.params.id) {
				let prev = await Properties.near(result._id, 'prev')
				let next = await Properties.near(result._id, 'next')
				let prop = result.toJSON()
				response = { ...prop }
				response.prev = prev
				response.next = next
			}

			else {
				response = {...result}
			}

			res.send(response)
			
		}

		catch (err) {
			res.status(err.status || 400).send({err})
		}
	}

	static async create (req, res) {
		const files = req.files ?  req.files['photos[]'] : []
		const images = !isArray(files) ? [files] : files
		const uploadPromises = []

		// images.map(image => uploadPromises.push(image.mv(`${process.env.PWD}/${process.env.APP_PUBLIC}/${image.file}`)))
		images.map(image => {
			uploadPromises.push(Upload.image(image))
		})


		Promise.all(uploadPromises)
			.then(async sources => {
				try {
					const property = new Property()
					property.title = req.body.title
					property.description = req.body.description
					property.photos = req.body.files
					property.category = req.body.category
					property.cert = req.body.cert
					property.amenities = req.body['amenities[]']

					property.address = {}
					property.address.line1 = req.body.address_line1
					property.address.line2 = req.body.address_line2
					property.address.line3 = req.body.address_line3
					property.address.zip = req.body.address_zip
					property.address.country = req.body.address_country
					property.address.region = req.body.address_region
					property.address.city = req.body.address_city

					property.address.location = {}
					property.address.location.lat = req.body.address_lat
					property.address.location.lon = req.body.address_lon
					
					property.cost = req.body.cost
					property.owner = req.body.owner
					property.maintenance = req.body.maintenance
					property.contract = {}
					property.contract.length = req.body.contract_length
					property.contract.warranty = req.body.contract_warranty
					property.contract.monthsInAdvance = req.body.contract_months_in_advance
					property.access = req.body.access
					property.status = req.body.status
					property.options = req.body.options
					property.photos = []

					const photosPromises = []

					sources.map(src => {
						console.log({src, name: `${src.public_id}.${src.format}` })
						photosPromises.push(new File({
							name: `${src.public_id}.${src.format}`,
							type: 'image',
							path: src.secure_url,
							object: property.id,
							objectModel: 'Property'
						}).save())
					})

					Promise.all(photosPromises)
						.then(async photos => {
							photos.map(photo => {
								property.photos.push(photo.id)
							})
						})
						.then(async () => {
							await property.save()
							res.send({property})
						})
				}

				catch (err) {
					res.status(err.status || 400).send(err)
				}
			}).catch(err => {
				console.log(err)
			})


	}

	static async update (req, res) {
		try {
			let property = await Property.updateOne({_id: req.params.id}, req.body)
			res.send(null)
		}
		catch (err) {
			res.status(err.status || 400).send(err)
		}
	}
	
	static async delete (req, res) {
		try {
			let property = await Property.findById(req.params.id)
			if (!property.deleted) {
				property.softdelete()
				res.send(null)
			}
			else {
				res.boom.notFound()
			}
		}
		catch (err) {
			res.status(err.status || 400).send(err)
		} 
	}

	static async restore (req, res) {
		try {
			const property = await Property.findById(req.params.id)
			if (property.deleted) {
				property.restore()
				res.send(null)
			}
			else {
				res.boom.notFound()
			}			
		}
		catch (err) {
			res.status(err.status || 400).send(err)
		}
	}

	static async near (id, type) {
		const $near = type === 'next' ? "$gt" : "$lt"
		const filter = { _id: {} }
		filter._id[$near] = Types.ObjectId(id)
		return await Property
			.findOne(filter, {
				requests: false,
				reviews: false,
				options: false,
				owner: false,
				files: false,
				rates: false,
				cert: false
			})
			.where({
				deleted: false
			})
	}
 
}