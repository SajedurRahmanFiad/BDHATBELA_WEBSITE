import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAdmin } from '../AdminContext';
import { useCart } from '../CartContext';
import { useAuth } from '../AuthContext';
import { Star, ShoppingCart, Zap, Check, Plus, Minus, Share2, MessageSquare, X } from 'lucide-react';
import { ProductCard } from '../components/product/ProductCard';
import { motion, AnimatePresence } from 'motion/react';

export const ProductDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { products, addReview } = useAdmin();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [activeVariationIndex, setActiveVariationIndex] = useState<number | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    comment: '',
    name: user?.name || '',
    phone: user?.phone || ''
  });

  React.useEffect(() => {
    if (user) {
      setReviewForm(prev => ({
        ...prev,
        name: user.name,
        phone: user.phone
      }));
    }
  }, [user]);

  const product = products.find(p => p.id === id);

  if (!product) return <div className="py-20 text-center font-bold text-xl">Product not found.</div>;

  const images = product.images || [];
  const selectedVariation = product.productType === 'variation' && product.variations && product.variations.length > 0 && (activeVariationIndex !== null) ? product.variations[activeVariationIndex] : undefined;
  const normalizeSrc = (src?: string | null) => {
    if (!src || typeof src !== 'string') return null;
    const trimmed = src.trim();
    if (!trimmed) return null;
    return trimmed.startsWith('data:') ? trimmed.replace(/\s+/g, '') : trimmed;
  };
  const displayImage = normalizeSrc(selectedVariation?.media ?? images[activeImage] ?? images[0] ?? null);
  const displayPrice = selectedVariation?.discountPrice ?? selectedVariation?.price ?? product.discountPrice ?? product.price;
  const basePrice = selectedVariation?.price ?? product.price;

  React.useEffect(() => {
    if (product && product.productType === 'variation' && (product.variations || []).length > 0 && activeVariationIndex === null) {
      const def = (product.variations || []).findIndex(v => v.isDefault);
      setActiveVariationIndex(def >= 0 ? def : 0);
    }
  }, [product]);

  const handleBuyNow = () => {
    addToCart(product, quantity, false, selectedVariation);
    navigate('/checkout');
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewForm.comment || !reviewForm.name || !reviewForm.phone) {
      alert('Please fill out all fields');
      return;
    }

    addReview(product.id, {
      id: `rev-${Date.now()}`,
      userName: reviewForm.name,
      rating: reviewForm.rating,
      comment: reviewForm.comment,
      date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    });

    setShowReviewModal(false);
    setReviewForm({ ...reviewForm, comment: '', rating: 5 });
  };

  const relatedProducts = products.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4);

  return (
    <div className="container mx-auto px-4 py-8 space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 bg-white px-6 py-5 md:p-10 rounded-3xl shadow-sm border border-gray-100">
        {/* Images */}
        <div className="space-y-4">
            <div className="aspect-square bg-gray-50 rounded-2xl overflow-hidden border flex items-center justify-center">
              {displayImage ? (
                displayImage.match(/\.(mp4|webm|ogg|mov)$/i) ? (
                  <video src={displayImage} controls autoPlay muted className="w-full h-full object-contain bg-black" />
                ) : (
                  <img src={displayImage} alt={product.name} className="w-full h-full object-contain" />
                )
              ) : (
                <div className="text-gray-400">No image available</div>
              )}
            </div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            {(images || []).map((img, idx) => {
              const safeImg = normalizeSrc(String(img));
              return (
                <button 
                  key={idx}
                  onClick={() => { setActiveImage(idx); setActiveVariationIndex(null); }}
                  className={`w-20 h-20 rounded-lg border-2 overflow-hidden shrink-0 relative ${activeImage === idx && !selectedVariation ? 'border-primary' : 'border-gray-200 opacity-60 hover:opacity-100'}`}
                >
                  {safeImg ? (
                    safeImg.match(/\.(mp4|webm|ogg|mov)$/i) ? (
                      <>
                        <video src={safeImg} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                          <div className="w-6 h-6 rounded-full bg-white/80 flex items-center justify-center pl-0.5 shadow">
                            ▶
                          </div>
                        </div>
                      </>
                    ) : (
                      <img src={safeImg} alt="" className="w-full h-full object-cover" />
                    )
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">No preview</div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-col">
          <div className="mb-0">
            <div className="flex items-center justify-between gap-4 mb-2">
              <div className="flex items-center gap-2">
                <span className="bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full">{product.category}</span>
                {product.badge && <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded uppercase shadow-sm tracking-wider">{product.badge}</span>}
              </div>
              <button 
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: product.name, url: window.location.href });
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                    alert("Link copied to clipboard!");
                  }
                }}
                className="text-gray-400 hover:text-gray-900 p-2 bg-gray-50 rounded-full hover:bg-gray-100 transition-colors"
                title="Share"
              ><Share2 size={16} /></button>
            </div>
            <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2">{product.name}</h1>
            {product.shortDescription && <p className="text-sm text-gray-500 mb-4 leading-relaxed max-w-lg">{product.shortDescription}</p>}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-1">
                <Star size={18} className="fill-yellow-400 text-yellow-400" />
                <span className="font-bold">{product.rating}</span>
                <span className="text-gray-400 text-sm">({product.reviews.length} Reviews)</span>
              </div>
              <div className="h-4 w-[1px] bg-gray-200" />
              <div className="flex items-center gap-1 text-sm">
                <Check size={16} className="text-green-500" />
                {(() => {
                  const stockCount = selectedVariation ? (selectedVariation.stock ?? 0) : (product.stock ?? 0);
                  return (
                    <span className={stockCount > 0 ? "text-green-500 font-medium" : "text-red-500"}>
                      {stockCount > 0 ? `In Stock (${stockCount})` : "Out of Stock"}
                    </span>
                  );
                })()}
              </div>
            </div>

            <div className="flex items-baseline gap-4 mb-6">
               <span className="text-4xl font-black text-gray-900">৳{displayPrice}</span>
               {(selectedVariation?.discountPrice || product.discountPrice) && (
                 <span className="text-xl text-gray-400 line-through">৳{basePrice}</span>
               )}
            </div>

            {/* Variation thumbnails (for variation products) */}
            {product.productType === 'variation' && product.variations && product.variations.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-3">
                  {product.variations.map((v, idx) => (
                    <div key={idx} className="flex flex-col items-center">
                      <button onClick={() => { setActiveVariationIndex(idx); setActiveImage(0); }} className={`w-16 h-16 rounded-lg border overflow-hidden ${activeVariationIndex === idx ? 'border-primary' : 'border-gray-200'}`}>
                        {v.media ? (
                          String(v.media).match(/\.(mp4|webm|ogg|mov)$/i) ? (
                            <video src={String(v.media)} className="w-full h-full object-cover" />
                          ) : (
                            <img src={String(v.media)} alt={v.name} className="w-full h-full object-cover" />
                          )
                        ) : images[0] ? (
                          <img src={images[0]} alt={v.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">No preview</div>
                        )}
                      </button>
                      <span className="text-xs mt-1 text-gray-600 text-center max-w-[70px] line-clamp-1">{v.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-6">
              <span className="font-bold text-sm text-gray-500 uppercase tracking-wider">Quantity:</span>
              <div className="flex items-center border-2 border-gray-100 rounded-xl overflow-hidden">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-3 hover:bg-gray-100"><Minus size={18} /></button>
                <span className="px-6 font-bold">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="p-3 hover:bg-gray-100"><Plus size={18} /></button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
                <button 
                onClick={() => {
                  addToCart(product, quantity, true, selectedVariation);
                }}
                className="flex-1 bg-gray-900 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-gray-800 transition-all text-lg shadow-lg shadow-gray-200"
              >
                <ShoppingCart size={22} /> Add to Cart
              </button>
              <button 
                onClick={handleBuyNow}
                className="flex-1 bg-primary text-white py-4 rounded-xl font-bold flex items-center justify-center gap-3 hover-primary-dark transition-all text-lg shadow-lg shadow-red-200"
              >
                <Zap size={22} /> Buy Now
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Description & Reviews */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Details */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold mb-6 border-b pb-4">Product Details</h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600 leading-relaxed">{product.description}</p>
            </div>
          </div>

          {/* Reviews */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-8 border-b pb-4">
              <h2 className="text-xl font-bold">Customer Reviews ({product.reviews.length})</h2>
              <button 
                onClick={() => setShowReviewModal(true)}
                className="text-primary font-bold text-sm hover:underline flex items-center gap-2"
              >
                <MessageSquare size={16} /> Write a Review
              </button>
            </div>
            {product.reviews.length > 0 ? (
              <div className="space-y-6">
                {product.reviews.map(review => (
                  <div key={review.id} className="border-b last:border-0 pb-6">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center font-bold text-primary">
                        {review.userName[0]}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm">{review.userName}</h4>
                        <div className="flex items-center gap-2">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} size={12} className={i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} />
                            ))}
                          </div>
                          <span className="text-[10px] text-gray-400">{review.date}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 italic">"{review.comment}"</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-10 text-gray-400 italic">No reviews written yet.</p>
            )}
          </div>
        </div>

        {/* Review Modal */}
        <AnimatePresence>
          {showReviewModal && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
               <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowReviewModal(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
               />
               <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white w-full max-w-lg rounded-[40px] p-8 relative z-10 shadow-2xl overflow-hidden"
               >
                 <button 
                  onClick={() => setShowReviewModal(false)}
                  className="absolute right-6 top-6 text-gray-400 hover:text-gray-600"
                 >
                   <X size={24} />
                 </button>

                 <h2 className="text-2xl font-black tracking-tighter mb-6">Write a Review</h2>
                 
                 <form onSubmit={handleReviewSubmit} className="space-y-6">
                    <div className="space-y-2 text-center">
                       <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Rate the product</p>
                       <div className="flex justify-center gap-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button 
                              key={star}
                              type="button"
                              onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                              className="focus:outline-none transition-transform hover:scale-110"
                            >
                              <Star 
                                size={32} 
                                className={`${star <= reviewForm.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} 
                              />
                            </button>
                          ))}
                       </div>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Your Name</label>
                          <input 
                            type="text"
                            required
                            value={reviewForm.name}
                            onChange={(e) => setReviewForm({ ...reviewForm, name: e.target.value })}
                            className="w-full bg-gray-50 border-2 border-transparent focus:border-primary px-4 py-3 rounded-2xl outline-none transition-all"
                            placeholder="John Doe"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Phone Number</label>
                          <input 
                            type="tel"
                            required
                            value={reviewForm.phone}
                            onChange={(e) => setReviewForm({ ...reviewForm, phone: e.target.value })}
                            className="w-full bg-gray-50 border-2 border-transparent focus:border-primary px-4 py-3 rounded-2xl outline-none transition-all"
                            placeholder="017xxxxxxxx"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Your Comment</label>
                        <textarea 
                          required
                          value={reviewForm.comment}
                          onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                          className="w-full bg-gray-50 border-2 border-transparent focus:border-primary px-4 py-3 rounded-2xl outline-none transition-all h-32 resize-none"
                          placeholder="Write your review comments here..."
                        />
                      </div>
                    </div>

                    <button 
                      type="submit"
                      className="w-full bg-primary text-white py-4 rounded-2xl font-black shadow-xl shadow-red-100 hover-primary-dark transition-all"
                    >
                      Submit Review
                    </button>
                 </form>
               </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Sidebar/Suggestions */}
        <div className="space-y-6">
           <div className="bg-primary text-white p-6 rounded-3xl">
              <h3 className="font-bold text-lg mb-2 text-center">100% Authentic Product Guarantee</h3>
              <p className="text-xs opacity-80 text-center leading-relaxed font-normal">We guarantee 100% authentic, high-quality, and branded items. No counterfeit products.</p>
           </div>
           
           <div>
             <h3 className="font-bold mb-4">Related Products</h3>
             <div className="grid grid-cols-1 gap-4">
                {relatedProducts.map(p => <ProductCard key={p.id} product={p} />)}
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};
