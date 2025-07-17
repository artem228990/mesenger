const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const app = express();

app.use(bodyParser.json());

// Налаштування для відправки email (Gmail)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'your-email@gmail.com',
        pass: 'your-password'
    }
});

// Обробка замовлень
app.post('/api/orders', (req, res) => {
    const order = req.body;
    
    // Тут ви можете зберегти замовлення в базу даних
    
    // Відправка email з деталями замовлення
    const mailOptions = {
        from: 'your-email@gmail.com',
        to: ['your-email@gmail.com', order.email], // Вам і клієнту
        subject: `New Order: ${order.product}`,
        text: `
            New Order Details:
            Product: ${order.product}
            Size: ${order.size}
            Price: ${order.price}
            Customer Email: ${order.email}
            Phone: ${order.phone}
            Address: ${order.address}
            Card: **** **** **** ${order.cardNumber}
            
            Order time: ${new Date().toLocaleString()}
        `
    };
    
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
            return res.status(500).send({success: false});
        }
        console.log('Email sent:', info.response);
        res.send({success: true});
    });
});

app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});