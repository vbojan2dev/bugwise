/*
 * FoodDash 2.0 demo data: restaurants, menus, addresses and the test user.
 * Prices are in EUR; Serbian (RSD) prices are derived with a fixed menu exchange rate.
 */
import { SPEC } from '@/lib/capstone';
import type { Lang } from './types';

export type Cuisine = 'pizza' | 'balkan' | 'asian' | 'american' | 'desserts' | 'healthy' | 'mexican' | 'indian';
export type Tr = Record<Lang, string>;

export interface Dish {
  id: string;
  name: string;
  desc: Tr;
  eur: number;
}

export interface Restaurant {
  id: string;
  name: string;
  cuisine: Cuisine;
  rating: number;
  reviews: number;
  eta: [number, number];
  /** Opening hours in minutes since midnight. */
  hours: [number, number];
  hue: number;
  dishes: Dish[];
}

const h = (hh: number, mm = 0) => hh * 60 + mm;
const d = (id: string, name: string, eur: number, en: string, de: string, sr: string): Dish => ({ id, name, eur, desc: { en, de, sr } });

export const RESTAURANTS: Restaurant[] = [
  {
    id: 'napoli', name: 'Pizzeria Napoli', cuisine: 'pizza', rating: 4.7, reviews: 1840, eta: [25, 35], hours: [h(11), h(23)], hue: 8,
    dishes: [
      d('margherita', 'Margherita', 9.5, 'Tomato, fior di latte, basil', 'Tomate, Fior di Latte, Basilikum', 'Paradajz, fior di latte, bosiljak'),
      d('diavola', 'Diavola', 11.9, 'Spicy salami, chili, mozzarella', 'Scharfe Salami, Chili, Mozzarella', 'Ljuta salama, čili, mocarela'),
      d('quattro', 'Quattro formaggi', 12.4, 'Four cheeses, honey drizzle', 'Vier Käsesorten, etwas Honig', 'Četiri vrste sira, malo meda'),
      d('tiramisu', 'Tiramisù', 5.9, 'Mascarpone, espresso, cocoa', 'Mascarpone, Espresso, Kakao', 'Maskarpone, espreso, kakao'),
      d('pellegrino', 'San Pellegrino 0.5 l', 2.8, 'Sparkling mineral water', 'Mineralwasser mit Kohlensäure', 'Gazirana mineralna voda'),
    ],
  },
  {
    id: 'zike', name: 'Balkan Grill Kod Žike', cuisine: 'balkan', rating: 4.8, reviews: 962, eta: [30, 40], hours: [h(12), h(24)], hue: 25,
    dishes: [
      d('cevapi', 'Ćevapi (10 pcs)', 10.9, 'Grilled minced meat, lepinja, onion', 'Gegrilltes Hackfleisch, Lepinja, Zwiebeln', 'Mleveno meso sa roštilja, lepinja, luk'),
      d('pljeskavica', 'Pljeskavica', 11.5, 'Balkan burger with kajmak', 'Balkan-Burger mit Kajmak', 'Pljeskavica sa kajmakom'),
      d('sopska', 'Šopska salata', 5.4, 'Tomato, cucumber, peppers, white cheese', 'Tomate, Gurke, Paprika, Weißkäse', 'Paradajz, krastavac, paprika, beli sir'),
      d('pomfrit', 'Pomfrit', 3.2, 'Crispy fries', 'Knusprige Pommes', 'Hrskavi pomfrit'),
      d('baklava', 'Baklava', 3.9, 'Walnuts, honey syrup', 'Walnüsse, Honigsirup', 'Orasi, sirup od meda'),
    ],
  },
  {
    id: 'sushi', name: 'Sushi Zen Garden – Authentic Japanese Kitchen by Chef Takeshi', cuisine: 'asian', rating: 4.6, reviews: 713, eta: [35, 45], hours: [h(12), h(22, 30)], hue: 200,
    dishes: [
      d('nigiri', 'Salmon nigiri (2 pcs)', 4.8, 'Fresh salmon on seasoned rice', 'Frischer Lachs auf Sushi-Reis', 'Svež losos na pirinču'),
      d('california', 'California roll (8 pcs)', 9.4, 'Crab, avocado, cucumber', 'Krebs, Avocado, Gurke', 'Rak, avokado, krastavac'),
      d('spicytuna', 'Spicy tuna roll (8 pcs)', 10.2, 'Tuna, sriracha mayo, scallions', 'Thunfisch, Sriracha-Mayo, Lauch', 'Tunjevina, šrirača majonez, mladi luk'),
      d('miso', 'Miso soup', 3.5, 'Tofu, wakame, spring onion', 'Tofu, Wakame, Frühlingszwiebel', 'Tofu, vakame, mladi luk'),
      d('mochi', 'Matcha mochi (3 pcs)', 5.1, 'Green tea rice cakes', 'Reiskuchen mit Grüntee', 'Kolačići od pirinča sa zelenim čajem'),
    ],
  },
  {
    id: 'petit', name: 'Le Petit Café', cuisine: 'desserts', rating: 4.5, reviews: 402, eta: [15, 25], hours: [h(7), h(15)], hue: 35,
    dishes: [
      d('creme', 'Crème brûlée', 6.5, 'Vanilla custard, caramel crust', 'Vanillecreme mit Karamellkruste', 'Krem od vanile sa karamelom'),
      d('croissant', 'Croissant au beurre', 2.9, 'Butter croissant, baked daily', 'Buttercroissant, täglich frisch', 'Kroasan sa puterom, svež svaki dan'),
      d('quiche', 'Quiche Lorraine', 8.9, 'Bacon, eggs, Gruyère', 'Speck, Eier, Gruyère', 'Slanina, jaja, grijer'),
      d('tatin', 'Tarte Tatin', 6.2, 'Caramelized apple tart', 'Karamellisierte Apfeltarte', 'Karamelizovana pita od jabuka'),
      d('aulait', 'Café au lait', 3.4, 'Coffee with hot milk', 'Kaffee mit heißer Milch', 'Kafa sa toplim mlekom'),
    ],
  },
  {
    id: 'green', name: 'Green Bowl', cuisine: 'healthy', rating: 4.4, reviews: 288, eta: [20, 30], hours: [h(10), h(21)], hue: 140,
    dishes: [
      d('buddha', 'Buddha bowl', 10.5, 'Quinoa, chickpeas, avocado, tahini', 'Quinoa, Kichererbsen, Avocado, Tahini', 'Kinoa, leblebije, avokado, tahini'),
      d('falafel', 'Falafel wrap', 8.2, 'Falafel, hummus, pickles', 'Falafel, Hummus, Pickles', 'Falafel, humus, kiseli krastavci'),
      d('acai', 'Açaí bowl', 7.9, 'Açaí, banana, granola', 'Açaí, Banane, Granola', 'Asai, banana, granola'),
      d('smoothie', 'Green smoothie', 4.9, 'Spinach, apple, ginger', 'Spinat, Apfel, Ingwer', 'Spanać, jabuka, đumbir'),
    ],
  },
  {
    id: 'taj', name: 'Taj Mahal Express', cuisine: 'indian', rating: 4.3, reviews: 530, eta: [35, 50], hours: [h(19), h(23, 30)], hue: 45,
    dishes: [
      d('butter', 'Butter chicken', 12.9, 'Creamy tomato curry, basmati rice', 'Cremiges Tomatencurry, Basmatireis', 'Kremasti kari od paradajza, basmati pirinač'),
      d('paneer', 'Paneer tikka masala', 11.4, 'Grilled cheese cubes in masala', 'Gegrillter Käse in Masala-Soße', 'Grilovani sir u masala sosu'),
      d('naan', 'Garlic naan', 2.5, 'Flatbread with garlic butter', 'Fladenbrot mit Knoblauchbutter', 'Lepinja sa puterom od belog luka'),
      d('lassi', 'Mango lassi', 3.8, 'Yogurt drink with mango', 'Joghurtgetränk mit Mango', 'Napitak od jogurta i manga'),
    ],
  },
  {
    id: 'guero', name: 'Taquería El Güero', cuisine: 'mexican', rating: 4.6, reviews: 377, eta: [25, 35], hours: [h(12), h(23)], hue: 330,
    dishes: [
      d('pastor', 'Tacos al pastor (3 pcs)', 9.9, 'Marinated pork, pineapple, cilantro', 'Mariniertes Schwein, Ananas, Koriander', 'Marinirana svinjetina, ananas, korijander'),
      d('quesadilla', 'Quesadilla de pollo', 8.5, 'Chicken, cheese, pico de gallo', 'Hähnchen, Käse, Pico de Gallo', 'Piletina, sir, pico de gallo'),
      d('guac', 'Guacamole & totopos', 5.2, 'Fresh avocado dip, corn chips', 'Frischer Avocado-Dip, Maischips', 'Svež dip od avokada, kukuruzni čips'),
      d('churros', 'Churros', 4.6, 'With chocolate sauce', 'Mit Schokoladensoße', 'Sa čokoladnim sosom'),
    ],
  },
  {
    id: 'wok', name: 'Wok & Roll', cuisine: 'asian', rating: 4.2, reviews: 1205, eta: [20, 30], hours: [h(11, 30), h(22)], hue: 270,
    dishes: [
      d('padthai', 'Pad thai', 10.2, 'Rice noodles, tamarind, peanuts', 'Reisnudeln, Tamarinde, Erdnüsse', 'Pirinčani rezanci, tamarind, kikiriki'),
      d('ramen', 'Tonkotsu ramen', 12.8, 'Pork broth, egg, chashu', 'Schweinebrühe, Ei, Chashu', 'Supa od svinjetine, jaje, čašu'),
      d('gyoza', 'Gyoza (6 pcs)', 5.6, 'Pan-fried dumplings', 'Gebratene Teigtaschen', 'Pržene knedlice'),
      d('bubble', 'Bubble tea', 4.4, 'Milk tea with tapioca pearls', 'Milchtee mit Tapiokaperlen', 'Čaj sa mlekom i tapiokom'),
    ],
  },
  {
    id: 'brothers', name: 'Burger Brothers', cuisine: 'american', rating: 4.5, reviews: 2210, eta: [20, 30], hours: [h(11), h(23)], hue: 15,
    dishes: [
      d('cheeseburger', 'Classic cheeseburger', 9.8, 'Beef, cheddar, pickles, house sauce', 'Rind, Cheddar, Gurken, Haussoße', 'Junetina, čedar, kiseli krastavci, sos'),
      d('smash', 'Smash double', 12.5, 'Two smashed patties, onions', 'Zwei Smash-Patties, Zwiebeln', 'Dve tanke pljeskavice, luk'),
      d('sweetfries', 'Sweet potato fries', 4.3, 'With chipotle mayo', 'Mit Chipotle-Mayo', 'Sa čipotle majonezom'),
      d('shake', 'Vanilla milkshake', 4.9, 'Real vanilla, whipped cream', 'Echte Vanille, Sahne', 'Prava vanila, šlag'),
    ],
  },
  {
    id: 'mama', name: "Big Mama's Original Southern-Style Fried Chicken & Waffles House", cuisine: 'american', rating: 4.7, reviews: 845, eta: [30, 40], hours: [h(11), h(22)], hue: 40,
    dishes: [
      d('fried', 'Fried chicken (3 pcs)', 11.2, 'Buttermilk-brined, extra crispy', 'In Buttermilch mariniert, extra knusprig', 'Marinirana u mlaćenici, ekstra hrskava'),
      d('waffles', 'Chicken & waffles', 13.4, 'Maple syrup, hot honey', 'Ahornsirup, scharfer Honig', 'Javorov sirup, ljuti med'),
      d('mac', "Mac 'n' cheese", 5.9, 'Baked with three cheeses', 'Mit drei Käsesorten überbacken', 'Zapečeno sa tri vrste sira'),
      d('slaw', 'Coleslaw', 2.7, 'Creamy cabbage salad', 'Cremiger Krautsalat', 'Kremasta salata od kupusa'),
    ],
  },
  {
    id: 'dolce', name: 'Gelateria Dolce Vita', cuisine: 'desserts', rating: 4.9, reviews: 156, eta: [15, 20], hours: [h(12), h(22)], hue: 300,
    dishes: [
      d('pistachio', 'Pistachio gelato (2 scoops)', 4.5, 'Sicilian pistachios', 'Sizilianische Pistazien', 'Sicilijanski pistaći'),
      d('affogato', 'Affogato', 4.9, 'Vanilla gelato, hot espresso', 'Vanilleeis, heißer Espresso', 'Sladoled od vanile, topli espreso'),
      d('panna', 'Panna cotta', 5.3, 'With berry coulis', 'Mit Beerensoße', 'Sa sosom od bobica'),
      d('stracciatella', 'Stracciatella cup', 4.2, 'Milk gelato, chocolate flakes', 'Milcheis, Schokostückchen', 'Sladoled od mleka, listići čokolade'),
    ],
  },
];

export const DISHES: Record<string, Dish & { restaurantId: string }> = Object.fromEntries(
  RESTAURANTS.flatMap((r) => r.dishes.map((x) => [x.id, { ...x, restaurantId: r.id }])),
);
export const restaurantById = (id: string | null | undefined) => RESTAURANTS.find((r) => r.id === id);

export const CUISINES: Cuisine[] = ['pizza', 'balkan', 'asian', 'american', 'mexican', 'indian', 'healthy', 'desserts'];

export const USER = {
  name: 'Mia Novak',
  email: SPEC.testAccount.email,
  phone: '+49 151 2345 6789',
  home: 'Kastanienallee 7, 10435 Berlin',
};

/** Address "database" used by the autocomplete endpoint. */
export const ADDRESSES = [
  'Kastanienallee 7, 10435 Berlin',
  'Kastanienallee 32, 10435 Berlin',
  'Kantstraße 112, 10627 Berlin',
  'Friedrichstraße 43, 10117 Berlin',
  'Friedrichshainer Straße 5, 10407 Berlin',
  'Karl-Marx-Allee 90, 10243 Berlin',
  'Torstraße 125, 10119 Berlin',
  'Oranienstraße 18, 10999 Berlin',
  'Schönhauser Allee 36, 10435 Berlin',
  'Bergmannstraße 4, 10961 Berlin',
  'Knez Mihailova 12, 11000 Beograd',
  'Bulevar kralja Aleksandra 73, 11000 Beograd',
];

/** Fixed menu exchange rate used by the restaurants for RSD prices. */
export const RSD_RATE = 117.2;
