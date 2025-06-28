// Мок-дані для демонстрації
let mockData = {
    price: 42350.42,
    change24h: 2.34,
    orderBook: {
        asks: [
            { price: 42355.12, amount: 0.4521 },
            { price: 42360.45, amount: 1.2145 },
            { price: 42370.89, amount: 0.7842 },
            { price: 42380.23, amount: 2.4512 },
            { price: 42395.67, amount: 1.0245 }
        ],
        bids: [
            { price: 42345.78, amount: 1.1245 },
            { price: 42340.12, amount: 0.7842 },
            { price: 42335.67, amount: 2.4512 },
            { price: 42330.23, amount: 0.4521 },
            { price: 42325.89, amount: 1.2145 }
        ]
    },
    history: [
        { time: '2023-05-01', value: 40000 },
        { time: '2023-05-02', value: 40500 },
        { time: '2023-05-03', value: 41000 },
        { time: '2023-05-04', value: 41500 },
        { time: '2023-05-05', value: 42000 },
        { time: '2023-05-06', value: 42500 },
        { time: '2023-05-07', value: 42350 }
    ],
    userOrders: [
        { id: 1, date: '2023-05-06 10:30', type: 'buy', price: 42000, amount: 0.1, status: 'filled' },
        { id: 2, date: '2023-05-06 11:45', type: 'sell', price: 42500, amount: 0.05, status: 'pending' },
        { id: 3, date: '2023-05-07 09:15', type: 'buy', price: 42300, amount: 0.2, status: 'pending' }
    ]
};

// Ініціалізація графіка
document.addEventListener('DOMContentLoaded', function() {
    // Оновлення поточного курсу
    updatePriceTicker();
    
    // Ініціалізація графіка цін
    initPriceChart();
    
    // Оновлення стакану заявок
    updateOrderBook();
    
    // Оновлення списку ордерів користувача
    updateUserOrders();
    
    // Обробник кнопки розміщення ордера
    document.getElementById('place-order').addEventListener('click', placeOrder);
});

function updatePriceTicker() {
    document.getElementById('current-price').textContent = `$${mockData.price.toFixed(2)}`;
    
    const changeElement = document.getElementById('price-change');
    changeElement.textContent = `${mockData.change24h > 0 ? '+' : ''}${mockData.change24h.toFixed(2)}%`;
    
    if (mockData.change24h > 0) {
        changeElement.classList.remove('negative', 'neutral');
        changeElement.classList.add('positive');
    } else if (mockData.change24h < 0) {
        changeElement.classList.remove('positive', 'neutral');
        changeElement.classList.add('negative');
    } else {
        changeElement.classList.remove('positive', 'negative');
        changeElement.classList.add('neutral');
    }
}

function initPriceChart() {
    const chartContainer = document.getElementById('price-chart');
    const chart = LightweightCharts.createChart(chartContainer, {
        width: chartContainer.clientWidth,
        height: 350,
        layout: {
            backgroundColor: '#ffffff',
            textColor: '#333',
        },
        grid: {
            vertLines: {
                color: '#eee',
            },
            horzLines: {
                color: '#eee',
            },
        },
        rightPriceScale: {
            borderVisible: false,
        },
        timeScale: {
            borderVisible: false,
        },
    });

    const areaSeries = chart.addAreaSeries({
        topColor: 'rgba(33, 150, 243, 0.4)',
        bottomColor: 'rgba(33, 150, 243, 0.1)',
        lineColor: 'rgba(33, 150, 243, 1)',
        lineWidth: 2,
    });

    const formattedData = mockData.history.map(item => ({
        time: item.time,
        value: item.value
    }));

    areaSeries.setData(formattedData);

    // Адаптація розмірів графіка при зміні розміру вікна
    window.addEventListener('resize', function() {
        chart.applyOptions({ width: chartContainer.clientWidth });
    });
}

function updateOrderBook() {
    const asksContainer = document.querySelector('.asks');
    const bidsContainer = document.querySelector('.bids');
    
    asksContainer.innerHTML = '';
    bidsContainer.innerHTML = '';
    
    // Додаємо заявки на продаж (asks)
    mockData.orderBook.asks.forEach(order => {
        const row = document.createElement('div');
        row.className = 'order-row';
        row.innerHTML = `
            <span>${order.price.toFixed(2)}</span>
            <span>${order.amount.toFixed(4)}</span>
        `;
        asksContainer.appendChild(row);
    });
    
    // Додаємо заявки на купівлю (bids)
    mockData.orderBook.bids.forEach(order => {
        const row = document.createElement('div');
        row.className = 'order-row';
        row.innerHTML = `
            <span>${order.price.toFixed(2)}</span>
            <span>${order.amount.toFixed(4)}</span>
        `;
        bidsContainer.appendChild(row);
    });
}

function updateUserOrders() {
    const tbody = document.querySelector('#orders-table tbody');
    tbody.innerHTML = '';
    
    mockData.userOrders.forEach(order => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${order.date}</td>
            <td class="${order.type}-order">${order.type === 'buy' ? 'Купівля' : 'Продаж'}</td>
            <td>$${order.price.toFixed(2)}</td>
            <td>${order.amount.toFixed(4)}</td>
            <td>$${(order.price * order.amount).toFixed(2)}</td>
            <td>${order.status === 'filled' ? 'Виконано' : 'В очікуванні'}</td>
            <td>${order.status === 'pending' ? `<button class="cancel-btn" data-id="${order.id}">Скасувати</button>` : ''}</td>
        `;
        tbody.appendChild(row);
    });
    
    // Додаємо обробники подій для кнопок скасування
    document.querySelectorAll('.cancel-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const orderId = parseInt(this.getAttribute('data-id'));
            cancelOrder(orderId);
        });
    });
}

function placeOrder() {
    const type = document.getElementById('trade-type').value;
    const amount = parseFloat(document.getElementById('trade-amount').value);
    const price = parseFloat(document.getElementById('trade-price').value);
    
    if (!amount || !price) {
        alert('Будь ласка, введіть кількість та ціну');
        return;
    }
    
    // Додаємо новий ордер
    const newOrder = {
        id: mockData.userOrders.length + 1,
        date: new Date().toISOString().replace('T', ' ').substring(0, 19),
        type,
        price,
        amount,
        status: 'pending'
    };
    
    mockData.userOrders.push(newOrder);
    updateUserOrders();
    
    // Очищаємо поля форми
    document.getElementById('trade-amount').value = '';
    document.getElementById('trade-price').value = '';
    
    alert(`Ордер на ${type === 'buy' ? 'купівлю' : 'продаж'} ${amount} по ціні ${price} успішно розміщено!`);
}

function cancelOrder(orderId) {
    mockData.userOrders = mockData.userOrders.filter(order => order.id !== orderId);
    updateUserOrders();
    alert(`Ордер #${orderId} скасовано`);
}