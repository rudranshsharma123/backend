
const express = require('express')

// const session = require('express-session')
// var memeorystore = require('memorystore')(session)

const app = express()


// middleware
app.use(express.json())

const priceToProductMap = {
    basicMonthly: "price_1LoMhzFOlrjAHlmzpSvyrxNX",
    basicYearly: "price_1LoMhzFOlrjAHlmzwTj6iS6u",
    standardMonthly: "price_1LoMibFOlrjAHlmzbBxbjtN3",
    standardYearly: "price_1LoMibFOlrjAHlmzGzXefTiF",
    premiumMonthly: "price_1LoMjBFOlrjAHlmzSiByY7Ki",
    premiumYearly: "price_1LoMjBFOlrjAHlmzCncSxsCP",
    regularMonthly: "price_1LoMjiFOlrjAHlmzTF4huC3K",
    regularYearly: "price_1LoMjiFOlrjAHlmzfyEifscy"
}
const Stripe = require("stripe")
const stripe = Stripe("sk_test_51HufwtFOlrjAHlmz1lm6Hd3we1fj828GGSGxyuYF7t65ZoRk8FJwlwe9JR3Fe9xh8WATINP2lvfhTMyAiEgNhsVh00yLYvo96S");

const addNewCustomer = async (email, desc, name) => {
    const customer = await stripe.customers.create({
        email: email,
        name: name,
        description: desc,
    });
    return customer;
}

const createCheckoutSession = async (customer, priceID) => {
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        customer: customer,
        line_items: [
            {
                price: priceID,
                quantity: 1,
            },
        ],
        mode: 'subscription',
        success_url: 'https://richpanel-assessment-frontend-u4x.vercel.app/success',
        cancel_url: 'https://richpanel-assessment-frontend-u4x.vercel.app/failure',
    });
    return session;
}

const getCustomer = async (customerID) => {
    const customer = await stripe.customers.retrieve(customerID);
    return customer;
}

const cancelSubscription = async (custID) => {
    const subscriptions = await stripe.subscriptions.list({
        customer: custID,
    });
    try {
        const subID = subscriptions["data"][0]["id"];
        console.log(subID);
        const session = await stripe.subscriptions.del(subID);
        return session;
    } catch (error) {
        console.log(error)
    }

}


app.post("/login", async (req, res) => {
    const { email, name, desc } = req.body;
    const customer = await addNewCustomer(email, desc, name);
    res.send(customer);
    // res.redirect("http://localhost:3000/login");
});

app.post("/checkout", async (req, res) => {
    const { email, name, desc, product, isMonthly } = req.body;
    const realProduct = isMonthly ? product + "Monthly" : product + "Yearly";
    const priceID = priceToProductMap[realProduct];
    const customer = await addNewCustomer(email, desc, name);
    const session = await createCheckoutSession(customer.id, priceID);

    res.send({ url: session.url, stripeID: customer.id, subID: session.id, sub: session });
})

app.post('/cancel', async (req, res) => {
    const { custID } = req.body;

    const session = await cancelSubscription(custID);
    res.send(session);
})

// routes
app.get('/', (req, res) => {
    res.send('Hello World')
})




// listen
app.listen(5000, () => console.log('Server is running on port 8282'))
