/** Deterministic fake data for the infinite scroll demos (no network, no randomness). */

const dishes = [
  'Lemon chicken',
  'Mushroom risotto with thyme and a very generous amount of parmesan',
  'Pad thai',
  'Spinach and ricotta cannelloni',
  'Fish tacos',
  'Slow-cooked beef ragù for Sunday lunch with the whole family',
  'Shakshuka',
  'Miso ramen',
  'Greek salad',
  'Sweet potato curry',
  'Banana bread',
  'Crispy tofu bowl with peanut sauce, pickled carrots and sesame',
  'Gazpacho',
  'Pierogi',
  'Chili sin carne',
  'Blueberry pancakes',
  'Paella',
  'Falafel wrap',
  'Tomato soup',
  'Apple crumble',
];
const cuisines = ['Italian', 'Thai', 'Mexican', 'Spanish', 'Japanese', 'Greek', 'Indian', 'Polish', 'Middle Eastern', 'British'];
const colors = ['#f4a261', '#e76f51', '#2a9d8f', '#e9c46a', '#8ab17d', '#5e60ce', '#ff8fab', '#48cae4', '#b5838d', '#6d6875'];

export interface Recipe {
  id: string;
  n: number;
  title: string;
  meta: string;
  color: string;
}

export function recipe(i: number): Recipe {
  return {
    id: `r${i + 1}`,
    n: i + 1,
    title: dishes[(i * 7) % dishes.length],
    meta: `${10 + ((i * 13) % 50)} min · ${cuisines[(i * 3) % cuisines.length]}`,
    color: colors[i % colors.length],
  };
}

const kinds = [
  'Trail Runner 2 GTX waterproof hiking shoe',
  'Down jacket',
  'Ultralight 2-person tent',
  'Headlamp',
  'Merino wool base layer, long sleeve, regular fit',
  'Trekking poles',
  'Sleeping bag −5 °C',
  'Water filter',
  'Rain shell',
  'Camping stove',
  'Insulated bottle 750 ml',
  '35 L daypack with rain cover and hip belt pockets',
  'Fleece hoodie',
  'Compass',
  'Gaiters',
  'Camp chair',
];
const brands = ['Northpeak', 'Fjell', 'Summit & Co', 'Trailborn', 'Alpenwerk', 'Kestrel'];

export interface Product {
  id: string;
  n: number;
  name: string;
  brand: string;
  price: string;
  color: string;
}

export function product(i: number, sale = false): Product {
  const base = 19 + ((i * 37) % 280);
  return {
    id: `${sale ? 's' : 'p'}${i + 1}`,
    n: i + 1,
    name: kinds[(i * 5 + (sale ? 3 : 0)) % kinds.length],
    brand: brands[(i * 7) % brands.length],
    price: sale ? `€${(base * 0.7).toFixed(2)}` : `€${base}.${i % 2 ? '99' : '00'}`,
    color: colors[(i * 3 + (sale ? 5 : 0)) % colors.length],
  };
}
