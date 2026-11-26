import ethBeyaynetu from './assets/eth-beyaynetu.webp'
import ethBuna from './assets/eth-buna.webp'
import ethCampaign from './assets/eth-campaign.webp'
import ethDoro from './assets/eth-doro-wat.webp'
import ethKitfo from './assets/eth-kitfo.webp'
import ethShiro from './assets/eth-shiro.webp'
import ethTibs from './assets/eth-tibs.webp'
import heatCampaign from './assets/gebeta-campaign.webp'
import fieldGrain from './assets/dishes/field-grain.webp'
import fieldGreens from './assets/dishes/field-greens.webp'
import fieldHarvest from './assets/dishes/field-harvest.webp'
import fieldToast from './assets/dishes/field-toast.webp'
import fornoBianca from './assets/dishes/forno-bianca.webp'
import fornoHero from './assets/dishes/forno-hero.webp'
import fornoMargherita from './assets/dishes/forno-margherita.webp'
import fornoRossa from './assets/dishes/forno-rossa.webp'
import lunaFarfalle from './assets/dishes/luna-farfalle.webp'
import lunaGamberi from './assets/dishes/luna-gamberi.webp'
import lunaRagu from './assets/dishes/luna-ragu.webp'
import namiGyoza from './assets/dishes/nami-gyoza.webp'
import namiHero from './assets/dishes/nami-hero.webp'
import namiPlatter from './assets/dishes/nami-platter.webp'
import namiPoke from './assets/dishes/nami-poke.webp'
import namiRamen from './assets/dishes/nami-ramen.webp'
import petitCake from './assets/dishes/petit-cake.webp'
import petitLoaf from './assets/dishes/petit-loaf.webp'
import smokeBeef from './assets/dishes/smoke-beef.webp'
import smokePlatter from './assets/dishes/smoke-platter.webp'
import smokeSteak from './assets/dishes/smoke-steak.webp'
import ethBeyaynetuThumb from './assets/thumbs/eth-beyaynetu.webp'
import ethBunaThumb from './assets/thumbs/eth-buna.webp'
import ethCampaignThumb from './assets/thumbs/eth-campaign.webp'
import ethDoroThumb from './assets/thumbs/eth-doro-wat.webp'
import ethKitfoThumb from './assets/thumbs/eth-kitfo.webp'
import ethShiroThumb from './assets/thumbs/eth-shiro.webp'
import ethTibsThumb from './assets/thumbs/eth-tibs.webp'
import fieldGrainThumb from './assets/thumbs/field-grain.webp'
import fieldGreensThumb from './assets/thumbs/field-greens.webp'
import fieldHarvestThumb from './assets/thumbs/field-harvest.webp'
import fieldToastThumb from './assets/thumbs/field-toast.webp'
import fornoBiancaThumb from './assets/thumbs/forno-bianca.webp'
import fornoHeroThumb from './assets/thumbs/forno-hero.webp'
import fornoMargheritaThumb from './assets/thumbs/forno-margherita.webp'
import fornoRossaThumb from './assets/thumbs/forno-rossa.webp'
import lunaFarfalleThumb from './assets/thumbs/luna-farfalle.webp'
import lunaGamberiThumb from './assets/thumbs/luna-gamberi.webp'
import lunaRaguThumb from './assets/thumbs/luna-ragu.webp'
import namiGyozaThumb from './assets/thumbs/nami-gyoza.webp'
import namiHeroThumb from './assets/thumbs/nami-hero.webp'
import namiPlatterThumb from './assets/thumbs/nami-platter.webp'
import namiPokeThumb from './assets/thumbs/nami-poke.webp'
import namiRamenThumb from './assets/thumbs/nami-ramen.webp'
import petitCakeThumb from './assets/thumbs/petit-cake.webp'
import petitLoafThumb from './assets/thumbs/petit-loaf.webp'
import smokeBeefThumb from './assets/thumbs/smoke-beef.webp'
import smokePlatterThumb from './assets/thumbs/smoke-platter.webp'
import smokeSteakThumb from './assets/thumbs/smoke-steak.webp'
import cbeLogo from './assets/brands/cbe.svg'
import googleLogo from './assets/brands/google.svg'
import mastercardLogo from './assets/brands/mastercard.svg'
import telebirrLogo from './assets/brands/telebirr.svg'
import visaLogo from './assets/brands/visa.svg'
import { calculateTotals, lineItem, PRICING } from './domain/cart.ts'
import type {
  Address,
  CartItem,
  Dish,
  Extra,
  Order,
  PaymentMethod,
  Restaurant,
} from './domain/types.ts'

export const brands = {
  cbe: cbeLogo,
  google: googleLogo,
  mastercard: mastercardLogo,
  telebirr: telebirrLogo,
  visa: visaLogo,
}
export const campaignEthiopian = ethCampaign
export const campaignHeat = heatCampaign

export type { Extra, Dish, Restaurant, CartItem, Order, Address, PaymentMethod }
export { PRICING, lineItem }

const dish = (
  restaurantId: string,
  id: string,
  name: string,
  desc: string,
  price: number,
  image: string,
  thumb: string,
  cal: number,
  option: Dish['option'],
  extras: Extra[],
  tag?: string,
  local?: string,
): Dish => ({
  id,
  restaurantId,
  name,
  desc,
  price,
  image,
  thumb,
  cal,
  option,
  extras,
  tag,
  local,
})

export const restaurants: Restaurant[] = [
  {
    id: 'gursha',
    name: 'Gursha House',
    cuisine: 'Ethiopian',
    type: 'Ethiopian · Injera & wot',
    minutes: [20, 30],
    rating: 4.9,
    reviews: '3.6k',
    fee: 0,
    price: 2,
    image: ethCampaign,
    thumb: ethCampaignThumb,
    initial: 'ጉ',
    blurb: 'Slow-simmered wot, fresh teff injera every morning, and a coffee ceremony to finish.',
    menu: [
      dish(
        'gursha',
        'gursha-beyaynetu',
        'Beyaynetu',
        'Misir wot, kik alicha, gomen, shiro and atkilt on fresh teff injera',
        420,
        ethBeyaynetu,
        ethBeyaynetuThumb,
        640,
        { title: 'Injera', choices: ['Teff injera', 'Mixed grain injera'] },
        [
          { name: 'Extra injera', price: 40 },
          { name: 'Ayib', price: 80 },
          { name: 'Awaze', price: 30 },
        ],
        'Fasting friendly',
        'በያይነቱ',
      ),
      dish(
        'gursha',
        'gursha-doro',
        'Doro Wot',
        'Berbere chicken stew slow-cooked in niter kibbeh with a boiled egg',
        780,
        ethDoro,
        ethDoroThumb,
        820,
        { title: 'Spice level', choices: ['Medium', 'Hot', 'Habesha hot'] },
        [
          { name: 'Extra egg', price: 50 },
          { name: 'Ayib', price: 80 },
          { name: 'Extra injera', price: 40 },
        ],
        'Most loved',
        'ዶሮ ወጥ',
      ),
      dish(
        'gursha',
        'gursha-kitfo',
        'Special Kitfo',
        'Minced beef with mitmita and niter kibbeh, ayib, gomen and kocho',
        850,
        ethKitfo,
        ethKitfoThumb,
        760,
        { title: 'How it’s cooked', choices: ['Tire (raw)', 'Lebleb (rare)', 'Yebesele (cooked)'] },
        [
          { name: 'Kocho', price: 60 },
          { name: 'Extra ayib', price: 80 },
        ],
      ),
      dish(
        'gursha',
        'gursha-tibs',
        'Derek Tibs',
        'Seared beef with onion, jalapeño and rosemary, served sizzling in a shekla',
        690,
        ethTibs,
        ethTibsThumb,
        710,
        { title: 'Cut', choices: ['Beef', 'Lamb'] },
        [
          { name: 'Awaze', price: 30 },
          { name: 'Extra injera', price: 40 },
        ],
        'Sizzling',
        'ድርቅ ጥብስ',
      ),
      dish(
        'gursha',
        'gursha-shiro',
        'Shiro Tegabino',
        'Thick chickpea stew bubbling in a clay pot, with injera',
        320,
        ethShiro,
        ethShiroThumb,
        480,
        { title: 'Spice level', choices: ['Mild', 'Medium', 'Hot'] },
        [
          { name: 'Extra injera', price: 40 },
          { name: 'Green chili', price: 20 },
        ],
        'Vegan',
        'ሽሮ',
      ),
      dish(
        'gursha',
        'gursha-buna',
        'Buna Ceremony',
        'Freshly roasted coffee brewed in a jebena, served with popcorn — for two',
        250,
        ethBuna,
        ethBunaThumb,
        120,
        { title: 'Roast', choices: ['Traditional', 'Dark'] },
        [
          { name: 'Kolo snack', price: 60 },
          { name: 'Extra round', price: 120 },
        ],
        undefined,
        'ቡና',
      ),
    ],
  },
  {
    id: 'nami',
    name: 'Nami Kitchen',
    cuisine: 'Japanese',
    type: 'Japanese · Sushi & ramen',
    minutes: [20, 30],
    rating: 4.8,
    reviews: '2.1k',
    fee: 0,
    price: 3,
    image: namiHero,
    thumb: namiHeroThumb,
    initial: 'N',
    blurb: 'Season-led Japanese comfort food, cut and rolled to order every evening.',
    menu: [
      dish(
        'nami',
        'nami-poke',
        'Salmon Poke Bowl',
        'Sushi rice, cured salmon, edamame, pickled cabbage, sesame',
        980,
        namiPoke,
        namiPokeThumb,
        620,
        { title: 'Base', choices: ['Sushi rice', 'Brown rice', 'Greens'] },
        [
          { name: 'Avocado', price: 90 },
          { name: 'Soft egg', price: 60 },
          { name: 'Extra salmon', price: 320 },
        ],
        'Most loved',
      ),
      dish(
        'nami',
        'nami-ramen',
        'Shrimp Shoyu Ramen',
        'Twelve-hour broth, tiger shrimp, ajitama egg, scallion',
        920,
        namiRamen,
        namiRamenThumb,
        710,
        { title: 'Spice level', choices: ['Mild', 'Medium', 'Hot'] },
        [
          { name: 'Extra noodles', price: 120 },
          { name: 'Chili crisp', price: 50 },
          { name: 'Extra egg', price: 60 },
        ],
      ),
      dish(
        'nami',
        'nami-platter',
        'Omakase Sushi Platter',
        'Twenty-four pieces chosen by the chef from today’s market',
        2400,
        namiPlatter,
        namiPlatterThumb,
        840,
        { title: 'Soy', choices: ['Classic', 'Low sodium', 'Gluten-free tamari'] },
        [
          { name: 'Fresh wasabi', price: 90 },
          { name: 'Miso soup', price: 180 },
        ],
      ),
      dish(
        'nami',
        'nami-gyoza',
        'Pan-Fried Gyoza',
        'Six handmade dumplings with black vinegar',
        540,
        namiGyoza,
        namiGyozaThumb,
        380,
        { title: 'Filling', choices: ['Chicken', 'Vegetable'] },
        [
          { name: 'Chili oil', price: 40 },
          { name: 'Six more', price: 420 },
        ],
      ),
    ],
  },
  {
    id: 'luna',
    name: 'Luna Trattoria',
    cuisine: 'Italian',
    type: 'Italian · Handmade pasta',
    minutes: [25, 35],
    rating: 4.8,
    reviews: '1.8k',
    fee: 45,
    price: 3,
    image: lunaGamberi,
    thumb: lunaGamberiThumb,
    initial: 'L',
    blurb: 'Pasta rolled by hand each morning, sauces that take their time.',
    menu: [
      dish(
        'luna',
        'luna-gamberi',
        'Spaghetti ai Gamberi',
        'Red Sea prawns, chili, cherry tomato, parsley',
        1350,
        lunaGamberi,
        lunaGamberiThumb,
        780,
        { title: 'Pasta', choices: ['Spaghetti', 'Linguine', 'Gluten-free'] },
        [
          { name: 'Extra prawns', price: 380 },
          { name: 'Pangrattato', price: 60 },
        ],
        'Signature',
      ),
      dish(
        'luna',
        'luna-ragu',
        'Pappardelle Ragù',
        'Slow-braised beef, Parmigiano Reggiano',
        1150,
        lunaRagu,
        lunaRaguThumb,
        820,
        { title: 'Portion', choices: ['Regular', 'Large'] },
        [
          { name: 'Burrata', price: 320 },
          { name: 'Truffle oil', price: 150 },
        ],
      ),
      dish(
        'luna',
        'luna-farfalle',
        'Farfalle Estate',
        'Basil pesto, blistered tomatoes, rocket, pecorino',
        890,
        lunaFarfalle,
        lunaFarfalleThumb,
        590,
        { title: 'Pesto', choices: ['Classic basil', 'Nut-free'] },
        [
          { name: 'Grilled chicken', price: 240 },
          { name: 'Extra pecorino', price: 80 },
        ],
      ),
    ],
  },
  {
    id: 'forno',
    name: 'Forno 22',
    cuisine: 'Pizza',
    type: 'Neapolitan · Wood-fired',
    minutes: [30, 40],
    rating: 4.7,
    reviews: '3.1k',
    fee: 0,
    price: 2,
    image: fornoHero,
    thumb: fornoHeroThumb,
    initial: 'F',
    blurb: 'Forty-eight-hour dough, blistered in ninety seconds at 480°C.',
    menu: [
      dish(
        'forno',
        'forno-margherita',
        'Margherita',
        'Tomato, fior di latte, basil, olive oil',
        750,
        fornoMargherita,
        fornoMargheritaThumb,
        890,
        { title: 'Crust', choices: ['Classic', 'Well done'] },
        [
          { name: 'Buffalo mozzarella', price: 220 },
          { name: 'Hot honey', price: 90 },
        ],
        'Bestseller',
      ),
      dish(
        'forno',
        'forno-rossa',
        'Rossa Piccante',
        'Spicy beef salami, red onion, chili, oregano',
        850,
        fornoRossa,
        fornoRossaThumb,
        960,
        { title: 'Heat', choices: ['Medium', 'Hot', 'Very hot'] },
        [
          { name: 'Awaze drizzle', price: 40 },
          { name: 'Extra salami', price: 150 },
        ],
      ),
      dish(
        'forno',
        'forno-bianca',
        'Bianca al Tartufo',
        'Truffle cream, mushrooms, mozzarella, thyme',
        980,
        fornoBianca,
        fornoBiancaThumb,
        920,
        { title: 'Crust', choices: ['Classic', 'Well done'] },
        [
          { name: 'Shaved truffle', price: 450 },
          { name: 'Rocket', price: 60 },
        ],
      ),
    ],
  },
  {
    id: 'field',
    name: 'Field & Finch',
    cuisine: 'Healthy',
    type: 'Healthy · Bowls & salads',
    minutes: [15, 25],
    rating: 4.8,
    reviews: '980',
    fee: 35,
    price: 1,
    image: fieldHarvest,
    thumb: fieldHarvestThumb,
    initial: 'F',
    blurb: 'Market produce from Shola, bright dressings, nothing you’ll regret.',
    menu: [
      dish(
        'field',
        'field-harvest',
        'Rainbow Harvest Bowl',
        'Avocado, chickpeas, roasted squash, radish',
        620,
        fieldHarvest,
        fieldHarvestThumb,
        540,
        { title: 'Dressing', choices: ['Lemon tahini', 'Green goddess', 'Miso ginger'] },
        [
          { name: 'Falafel', price: 120 },
          { name: 'Grilled chicken', price: 200 },
        ],
        'Fan favorite',
      ),
      dish(
        'field',
        'field-grain',
        'Market Grain Bowl',
        'Herbed couscous, green beans, heirloom tomato',
        580,
        fieldGrain,
        fieldGrainThumb,
        510,
        { title: 'Grain', choices: ['Couscous', 'Quinoa', 'Teff'] },
        [
          { name: 'Halloumi', price: 180 },
          { name: 'Soft egg', price: 60 },
        ],
      ),
      dish(
        'field',
        'field-toast',
        'Smashed Avo & Egg',
        'Sourdough, jammy eggs, chili flakes, microgreens',
        450,
        fieldToast,
        fieldToastThumb,
        470,
        { title: 'Bread', choices: ['Sourdough', 'Gluten-free'] },
        [
          { name: 'Extra egg', price: 60 },
          { name: 'Smoked salmon', price: 280 },
        ],
      ),
      dish(
        'field',
        'field-greens',
        'Charred Greens Salad',
        'Kale, feta, pickled onion, toasted seeds',
        520,
        fieldGreens,
        fieldGreensThumb,
        390,
        { title: 'Size', choices: ['Regular', 'Large'] },
        [
          { name: 'Grilled chicken', price: 200 },
          { name: 'Avocado', price: 90 },
        ],
      ),
    ],
  },
  {
    id: 'smoke',
    name: 'Smoke & Salt',
    cuisine: 'Grill',
    type: 'Grill · Fire-cooked',
    minutes: [30, 45],
    rating: 4.6,
    reviews: '1.2k',
    fee: 60,
    price: 3,
    image: smokePlatter,
    thumb: smokePlatterThumb,
    initial: 'S',
    blurb: 'Wood-fired meats, smoky vegetables, and sauces with a kick.',
    menu: [
      dish(
        'smoke',
        'smoke-platter',
        'Mixed Grill Platter',
        'Chicken, lamb kofta, charred peppers, garlic toum',
        1650,
        smokePlatter,
        smokePlatterThumb,
        1180,
        { title: 'Sauce', choices: ['Garlic toum', 'Awaze', 'Chimichurri'] },
        [
          { name: 'Flatbread', price: 90 },
          { name: 'Extra kofta', price: 320 },
        ],
        'Built to share',
      ),
      dish(
        'smoke',
        'smoke-steak',
        'Steak Frites',
        'Grass-fed sirloin, rosemary fries, café de Paris butter',
        1890,
        smokeSteak,
        smokeSteakThumb,
        1050,
        { title: 'Temperature', choices: ['Medium rare', 'Medium', 'Well done'] },
        [
          { name: 'Peppercorn sauce', price: 120 },
          { name: 'Side salad', price: 180 },
        ],
      ),
      dish(
        'smoke',
        'smoke-beef',
        'Seared Beef Salad',
        'Flank steak, herbs, chili-lime dressing, cashews',
        980,
        smokeBeef,
        smokeBeefThumb,
        610,
        { title: 'Spice', choices: ['Mild', 'Medium', 'Hot'] },
        [
          { name: 'Sticky rice', price: 120 },
          { name: 'Extra beef', price: 320 },
        ],
      ),
    ],
  },
  {
    id: 'petit',
    name: 'Petit Four',
    cuisine: 'Bakery',
    type: 'Bakery · Cakes & bread',
    minutes: [15, 25],
    rating: 4.9,
    reviews: '760',
    fee: 0,
    price: 1,
    image: petitCake,
    thumb: petitCakeThumb,
    initial: 'P',
    blurb: 'Butter, flour, patience. Baked through the night in Bole.',
    menu: [
      dish(
        'petit',
        'petit-cake',
        'Raspberry Cream Cake',
        'Vanilla sponge, raspberry jam, Chantilly cream',
        280,
        petitCake,
        petitCakeThumb,
        430,
        { title: 'Size', choices: ['Slice', 'Double slice'] },
        [
          { name: 'Fresh berries', price: 90 },
          { name: 'Candle', price: 20 },
        ],
        'Sells out',
      ),
      dish(
        'petit',
        'petit-loaf',
        'Country Sourdough',
        'Seeded, naturally leavened, baked this morning',
        320,
        petitLoaf,
        petitLoafThumb,
        1200,
        { title: 'Slicing', choices: ['Whole loaf', 'Sliced'] },
        [
          { name: 'Cultured butter', price: 120 },
          { name: 'Honey', price: 90 },
        ],
      ),
    ],
  },
]

export const allDishes = restaurants.flatMap((r) => r.menu)
export const findRestaurant = (id: string) => restaurants.find((r) => r.id === id) ?? restaurants[0]
export const findDish = (id: string) => allDishes.find((d) => d.id === id) ?? allDishes[0]
export const thumbOf = (id: string): string | undefined =>
  allDishes.find((d) => d.id === id)?.thumb ?? restaurants.find((r) => r.id === id)?.thumb
export const cuisines = [
  'All',
  'Ethiopian',
  'Japanese',
  'Italian',
  'Pizza',
  'Healthy',
  'Grill',
  'Bakery',
]

/** Same formula as checkout: subtotal + delivery + service + VAT. */
const totalOf = (items: CartItem[], fee: number) => calculateTotals(items, { fee }, 0, '').total
const seed = (
  id: string,
  restaurantId: string,
  items: CartItem[],
  date: string,
  reviewed?: boolean,
): Order => ({
  id,
  restaurantId,
  items,
  total: totalOf(items, findRestaurant(restaurantId).fee),
  placedAt: 0,
  status: 'delivered',
  date,
  reviewed,
})

export const seedOrders: Order[] = [
  seed(
    'GB-2902',
    'gursha',
    [
      lineItem(findDish('gursha-doro'), 1, 'Hot', ['Extra egg']),
      lineItem(findDish('gursha-beyaynetu'), 1, 'Teff injera', []),
    ],
    'June 22',
    true,
  ),
  seed(
    'GB-2841',
    'nami',
    [
      lineItem(findDish('nami-poke'), 1, 'Sushi rice', ['Avocado']),
      lineItem(findDish('nami-gyoza'), 1, 'Chicken', []),
    ],
    'June 21',
    true,
  ),
  seed(
    'LT-1839',
    'luna',
    [
      lineItem(findDish('luna-gamberi'), 1, 'Spaghetti', []),
      lineItem(findDish('luna-farfalle'), 1, 'Classic basil', []),
    ],
    'June 18',
    true,
  ),
  seed('FF-1544', 'field', [lineItem(findDish('field-harvest'), 1, 'Lemon tahini', [])], 'May 28'),
]

export const places = [
  ['Bole Atlas, Building 14', 'Bole, Addis Ababa'],
  ['Edna Mall area', 'Bole Medhanialem, Addis Ababa'],
  ['Kazanchis Business District', 'Kirkos, Addis Ababa'],
  ['Sarbet, Mekanisa Road', 'Nifas Silk-Lafto, Addis Ababa'],
  ['CMC Michael', 'Yeka, Addis Ababa'],
  ['Piassa, Churchill Avenue', 'Arada, Addis Ababa'],
  ['Old Airport, Wello Sefer', 'Kirkos, Addis Ababa'],
  ['Megenagna Square', 'Yeka, Addis Ababa'],
  ['Arat Kilo, Sidist Kilo Road', 'Arada, Addis Ababa'],
]
