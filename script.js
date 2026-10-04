
const records = {};
const basket = {};
const rows = document.querySelector('#basket-lines');
const emptyRow = document.querySelector('#empty-basket');
const amount = document.querySelector('#basket-amount');
const counter = document.querySelector('#basket-quantity');

function money(value) {
  return value.toLocaleString('ru-RU') + ' ₽';
}

document.querySelectorAll('.release').forEach(function (card) {
  const code = card.dataset.record;
  records[code] = {
    title: card.dataset.title,
    price: Number(card.dataset.cost)
  };
  card.querySelector('button').disabled = false;
});


document.querySelector('.record-grid').addEventListener('click', function (event) {
  const button = event.target.closest('[data-add-record]');
  if (!button) return;
  const code = button.dataset.addRecord;
  basket[code] = (basket[code] || 0) + 1;
  drawBasket();
});

function addCell(row, text) {
  const cell = document.createElement('td');
  cell.textContent = text;
  row.append(cell);
  return cell;
}

function drawBasket() {
  rows.replaceChildren(emptyRow);
  const codes = Object.keys(basket);
  emptyRow.hidden = codes.length > 0;
  let sum = 0;
  let quantity = 0;

  codes.forEach(function (code) {
    const record = records[code];
    const subtotal = record.price * basket[code];
    sum += subtotal;
    quantity += basket[code];
    const row = document.createElement('tr');
    addCell(row, record.title);
    addCell(row, money(record.price));
    const quantityCell = addCell(row, '');
    const input = document.createElement('input');
    input.type = 'number';
    input.min = '1';
    input.step = '1';
    input.value = basket[code];
    input.dataset.quantity = code;
    input.setAttribute('aria-label', 'Количество: ' + record.title);
    quantityCell.append(input);
    addCell(row, money(subtotal));
    const actions = addCell(row, '');
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'Удалить';
    button.dataset.remove = code;
    button.setAttribute('aria-label', 'Удалить: ' + record.title);
    actions.append(button);
    rows.append(row);
  });
  amount.textContent = money(sum);
  counter.textContent = quantity;
}


rows.addEventListener('change', function (event) {
  const input = event.target.closest('[data-quantity]');
  if (!input) return;
  const code = input.dataset.quantity;
  const value = Number(input.value);
  // Пустое поле, ноль, отрицательное и дробное число не принимаются.
  if (!Number.isSafeInteger(value) || value < 1 ||
      !Number.isSafeInteger(value * records[code].price)) {
    input.value = basket[code];
    return;
  }
  basket[code] = value;
  drawBasket();
});

rows.addEventListener('click', function (event) {
  const button = event.target.closest('[data-remove]');
  if (!button) return;
  delete basket[button.dataset.remove];
  drawBasket();
});

drawBasket();
