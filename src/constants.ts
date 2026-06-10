import { Product, Category, Banner, OrderStatus, StoreSettings } from './types';

export const MOCK_CATEGORIES: Category[] = [
  { id: '1', name: 'Electronics', icon: 'Smartphone' },
  { id: '2', name: 'Fashion', icon: 'Shirt' },
  { id: '3', name: 'Home Appliances', icon: 'Home' },
  { id: '4', name: 'Books & Stationery', icon: 'Book' },
  { id: '5', name: 'Health & Beauty', icon: 'HeartPulse' },
  { id: '6', name: 'Grocery', icon: 'ShoppingBag' },
];

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'Smartphone Special Edition',
    shortDescription: 'Advanced technology with outstanding performance smartphone.',
    description: 'Advanced technology with outstanding performance and exceptional camera quality. Capture perfect moments and enjoy top-tier lag-free gaming experiences.',
    price: 25000,
    discountPrice: 22000,
    category: 'Electronics',
    images: ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800'],
    stock: 15,
    rating: 4.5,
    reviews: [
      { id: 'r1', userName: 'Arif Ahmed', rating: 5, comment: 'Excellent phone, best in this price range!', date: '2024-03-15' }
    ]
  },
  {
    id: 'p2',
    name: 'Premium Cotton Shirt',
    shortDescription: 'Comfortable cotton formal shirt.',
    description: 'Stylish and comfortable shirt designed with lightweight, highly breathable fabric. Perfect for office or casual smart wear. 100% fine cotton.',
    price: 1500,
    discountPrice: 1200,
    category: 'Fashion',
    images: ['https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800'],
    stock: 50,
    rating: 4.2,
    reviews: []
  },
  {
    id: 'p3',
    name: 'Air Purifier',
    shortDescription: 'Keep your rooms fresh and germ-free.',
    description: 'Ensures pristine visual styling and clean air for your indoor environment. Traps dust particles, allergen pollen, and bad odors efficiently.',
    price: 8500,
    category: 'Home Appliances',
    images: ['https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800'],
    stock: 8,
    rating: 4.8,
    reviews: []
  },
  {
    id: 'p4',
    name: 'Bestseller Novel Collection',
    shortDescription: 'A premium bundle of highly popular novels.',
    description: 'An amazing collection of curated novels from bestselling authors. Perfect as a gift item for any book lover. Crisp layout print with high quality bindings.',
    price: 800,
    discountPrice: 650,
    category: 'Books & Stationery',
    images: ['https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800'],
    stock: 100,
    rating: 4.9,
    reviews: []
  },
  {
    id: 'p5',
    name: 'Natural Facial Serum',
    shortDescription: '100% natural formula for premium skincare.',
    description: 'Nourish your skin cells, boost skin brightness, and eliminate wrinkles. Safe for all skin types. Absolutely no toxic chemicals used.',
    price: 1200,
    category: 'Health & Beauty',
    images: ['https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800'],
    stock: 30,
    rating: 4.6,
    reviews: []
  },
  {
    id: 'p6',
    name: 'Premium Basmati Rice 5kg',
    shortDescription: 'Highest quality long grain basmati rice.',
    description: 'Premium select long grain basmati rice perfect for rich dishes like polao or biryani. Provides rich flavor and exquisite aroma.',
    price: 950,
    category: 'Grocery',
    images: ['https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800'],
    stock: 200,
    rating: 4.7,
    reviews: []
  }
];

export const MOCK_BANNERS: Banner[] = [
  {
    id: 'b1',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600',
    title: 'Eid Special Offer - Up to 50% Off!',
    link: '/products?discount=true'
  },
  {
    id: 'b2',
    image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1600',
    title: 'Explore Our New Arrivals Now',
    link: '/products?new=true'
  }
];

export const INITIAL_SETTINGS: StoreSettings = {
  companyName: 'MyStore',
  logo: 'https://cdn-icons-png.flaticon.com/512/1162/1162499.png',
  favicon: 'https://cdn-icons-png.flaticon.com/512/1162/1162499.png',
  primaryColor: '#ef4444',
  contactPhone: '016XXXXXXXX',
  email: 'support@shop.com',
  socialLinks: {
    facebook: 'https://facebook.com',
    youtube: 'https://youtube.com',
    instagram: 'https://instagram.com'
  },
  shippingCharges: {
    insideDhaka: 60,
    outsideDhaka: 120
  },
  paymentGateways: {
    cod: { enabled: true },
    bkash: { enabled: true, number: '01XXXXXXXXX', type: 'Personal', instructions: 'Send money to our bKash Personal number and submit the Transaction ID.' },
    nagad: { enabled: true, number: '01XXXXXXXXX', type: 'Personal', instructions: 'Send money to our Nagad Personal number and submit the Transaction ID.' },
    rocket: { enabled: true, number: '01XXXXXXXXX', type: 'Personal', instructions: 'Send money to our Rocket Personal number and submit the Transaction ID.' },
    bank: { enabled: false, accountName: '', accountNumber: '', bankName: '', branchName: '', instructions: 'Deposit to our Bank account and upload the deposit receipt slip.' }
  }
};

export const DISTRICTS = [
  'Dhaka', 'Chattogram', 'Rajshahi', 'Khulna', 'Barishal', 'Sylhet', 'Rangpur', 'Mymensingh',
  'Bagerhat', 'Bandarban', 'Barguna', 'Bhola', 'Bogura', 'Brahmanbaria', 'Chandpur', 'Chapainawabganj',
  'Chuadanga', 'Cumilla', 'Cox\'s Bazar', 'Dinajpur', 'Faridpur', 'Feni', 'Gaibandha', 'Gazipur',
  'Gopalganj', 'Habiganj', 'Jamalpur', 'Jashore', 'Jhalokati', 'Jhenaidah', 'Joypurhat', 'Khagrachhari',
  'Kishoreganj', 'Kurigram', 'Kushtia', 'Lakshmipur', 'Lalmonirhat', 'Madaripur', 'Magura', 'Manikganj',
  'Meherpur', 'Moulvibazar', 'Munshiganj', 'Naogaon', 'Narail', 'Narayanganj', 'Narsingdi', 'Natore',
  'Netrokona', 'Nilphamari', 'Noakhali', 'Pabna', 'Panchagarh', 'Patuakhali', 'Pirojpur', 'Rajbari',
  'Rangamati', 'Satkhira', 'Shariatpur', 'Sherpur', 'Sirajganj', 'Sunamganj', 'Tangail', 'Thakurgaon'
].filter((v, i, a) => a.indexOf(v) === i).sort();
