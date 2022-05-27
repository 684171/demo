const Instacart = require('../../../backend/instacart')

export default async function handler(req, res) {
    if (req.method !== 'POST') res.status(400).json({err: 'Invalid Request Method'})
    if (!req?.body?.address || !req?.body?.postalCode) return res.status(400).json({err: 'Invalid Request Data'})

    const instacart = new Instacart()
    
    const {address, postalCode} = req.body

    const response = await instacart.register({
        address,
        postalCode
    })

    return res.status(200).json(response)
}