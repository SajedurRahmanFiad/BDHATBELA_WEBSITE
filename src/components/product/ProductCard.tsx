import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Zap, Star, Play } from 'lucide-react';
import { Product, ProductListing } from '../../types';
import { useCart } from '../../CartContext';
import { formatMoney } from '../../utils/money';
import { motion } from 'motion/react';

const normalizeSrc = (src?: string | null) => {
  if (!src || typeof src !== 'string') return null;
  const trimmed = src.trim();
  return trimmed ? trimmed : null;
};

const extractYouTubeId = (src?: string | null) => {
  if (!src || typeof src !== 'string') return null;
  const trimmed = src.trim();
  const normalized = trimmed.startsWith('youtube:') ? trimmed.slice(8) : trimmed;
  const match = normalized.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/i);
  return match ? match[1] : null;
};

const isYouTubeUrl = (src?: string | null) => !!extractYouTubeId(src);

const isVideoUrl = (src?: string | null) => {
  if (!src) return false;
  return !!src.match(/\.(mp4|webm|ogg|mov)$/i);
};

interface ProductCardProps {
  product: Product | ProductListing;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [isVideoHovered, setIsVideoHovered] = React.useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    const variation = product.productType === 'variation' && product.variations && product.variations.length > 0 ? (product.variations.find(v => v.isDefault) ?? product.variations[0]) : undefined;
    addToCart(product as Product, 1, false, variation);
    navigate('/checkout');
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    const variation = product.productType === 'variation' && product.variations && product.variations.length > 0 ? (product.variations.find(v => v.isDefault) ?? product.variations[0]) : undefined;
    addToCart(product as Product, 1, true, variation);
  };

  const normalizeMedia = (media?: string | string[] | null) => {
    if (!media) return null;
    if (Array.isArray(media)) return String(media[0] || '');
    return media;
  };

  const handleMouseEnter = () => {
    setIsVideoHovered(true);
  };

  const handleMouseLeave = () => {
    setIsVideoHovered(false);
  };

  React.useEffect(() => {
    const video = videoRef.current;
    if (!video || !isVideo || !isVideoUrl(img)) return;

    if (isVideoHovered) {
      video.currentTime = 0;
      video.muted = true;
      video.play().catch(() => {});
    } else {
      video.pause();
      video.currentTime = 0;
    }
  }, [isVideoHovered, img, isVideo]);

  const displayVar = product.productType === 'variation' ? (product.variations?.find(v => v.isDefault) ?? product.variations?.[0]) : undefined;
  const displayPrice = displayVar?.discountPrice ?? displayVar?.price ?? product.discountPrice ?? product.price;
  const displayBasePrice = displayVar?.discountPrice ? displayVar.price : (product.discountPrice ? product.price : undefined);

  const rawImg = product.productType === 'variation'
    ? normalizeMedia(product.variations?.find(v => v.isDefault)?.media ?? product.variations?.[0]?.media)
    : normalizeMedia((product.images && product.images.length ? product.images[0] : (product.variations && product.variations.length ? product.variations[0].media : null)));
  const img = normalizeSrc(rawImg);

  const youtubeId = isYouTubeUrl(img) ? extractYouTubeId(img) : null;
  const isVideo = isVideoUrl(img);

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-gray-100 flex flex-col group"
    >
      <Link
        to={`/product/${encodeURIComponent(product.sku ?? product.id)}`}
        className="relative aspect-square overflow-hidden bg-gray-100 block"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {(() => {
          if (!img) return <div className="w-full h-full flex items-center justify-center text-gray-300">No image</div>;

          // YouTube video - show thumbnail
          if (youtubeId) {
            return (
              <div className="relative w-full h-full">
                <img
                  src={`https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`}
                  alt={product.name}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
                  <Play size={48} className="text-white fill-white" />
                </div>
              </div>
            );
          }

          // Regular video - show first frame and play on hover
          if (isVideo) {
            return (
              <div className="relative w-full h-full">
                <video
                  ref={videoRef}
                  src={img}
                  preload="metadata"
                  muted
                  playsInline
                  loop
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
                  <Play size={48} className="text-white fill-white" />
                </div>
              </div>
            );
          }

          // Regular image
          return (
            <img
              src={img}
              alt={product.name}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          );
        })()}
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
        <Link to={`/product/${encodeURIComponent(product.sku ?? product.id)}`} className="hover:text-primary transition-colors mb-1 line-clamp-1 font-medium text-sm md:text-base">
          {product.name}
        </Link>
        
        <div className="flex items-center gap-1 mb-2">
          {[0, 1, 2, 3, 4].map(i => (
            <Star
              key={i}
              size={12}
              className={i < Math.round(product.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
            />
          ))}
          <span className="text-xs text-gray-500">{product.rating}</span>
        </div>

        <div className="mt-auto">
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-lg font-bold text-gray-900">৳{formatMoney(displayPrice)}</span>
            {displayBasePrice && (
              <span className="text-sm text-gray-400 line-through">৳{formatMoney(displayBasePrice)}</span>
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
