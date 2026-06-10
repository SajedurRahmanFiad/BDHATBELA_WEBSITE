import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Zap, Star } from 'lucide-react';
import { Product } from '../../types';
import { useCart } from '../../CartContext';
import { motion } from 'motion/react';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    addToCart(product, 1, false);
    navigate('/checkout');
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addToCart(product, 1);
  };

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-gray-100 flex flex-col group"
    >
      <Link to={`/product/${product.id}`} className="relative aspect-square overflow-hidden bg-gray-100 block">
        {product.images[0]?.match(/\.(mp4|webm|ogg|mov)$/i) ? (
          <video src={product.images[0]} autoPlay loop muted playsInline className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 pointer-events-none" />
        ) : (
          <img 
            src={product.images[0]} 
            alt={product.name} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        )}
        {product.discountPrice && (
          <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded">
            {Math.round(((product.price - product.discountPrice) / product.price) * 100)}% OFF
          </div>
        )}
        {product.badge && (
          <div className="absolute top-2 right-2 bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded uppercase shadow-sm">
            {product.badge}
          </div>
        )}
      </Link>

      <div className="p-3 md:p-4 flex flex-col flex-1">
        <Link to={`/product/${product.id}`} className="hover:text-primary transition-colors mb-1 line-clamp-1 font-medium text-sm md:text-base">
          {product.name}
        </Link>
        
        <div className="flex items-center gap-1 mb-2">
          <Star size={12} className="fill-yellow-400 text-yellow-400" />
          <span className="text-xs text-gray-500">{product.rating}</span>
        </div>

        <div className="mt-auto">
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-lg font-bold text-gray-900">৳{product.discountPrice || product.price}</span>
            {product.discountPrice && (
              <span className="text-sm text-gray-400 line-through">৳{product.price}</span>
            )}
          </div>

          <div className="flex gap-2">
            <button 
              onClick={handleAddToCart}
              className="flex-1 bg-gray-100 text-gray-800 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-1 text-xs"
            >
              <ShoppingCart size={14} /> Cart
            </button>
            <button 
              onClick={handleBuyNow}
              className="flex-1 bg-primary text-white py-2 rounded-lg hover-primary-dark transition-colors flex items-center justify-center gap-1 text-xs font-bold"
            >
              <Zap size={14} /> Buy
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
