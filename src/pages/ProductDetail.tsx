import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAdmin } from '../AdminContext';
import { useCart } from '../CartContext';
import { useAuth } from '../AuthContext';
import { Star, ShoppingCart, Zap, Check, Plus, Minus, Share2, MessageSquare, X, Play } from 'lucide-react';
import { ProductCard } from '../components/product/ProductCard';
import { sanitizeRichText } from '../components/product/RichTextEditor';
import { motion, AnimatePresence } from 'motion/react';
import { trackViewItem } from '../utils/ga4';
import { normalizeMediaSrc } from '../utils/media';

const extractYouTubeId = (src?: string | null) => {
  if (!src || typeof src !== 'string') return null;
  const trimmed = src.trim();
  const normalized = trimmed.startsWith('youtube:') ? trimmed.slice(8) : trimmed;
  const match = normalized.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/i);
  return match ? match[1] : null;
};

const getYouTubeEmbedUrl = (src?: string | null) => {
  const videoId = extractYouTubeId(src);
  return videoId ? `https://www.youtube.com/embed/${videoId}?rel=0&showinfo=0` : null;
};

export const ProductDetail: React.FC = () => {
  const { key } = useParams();
  const navigate = useNavigate();
  const { products, addReview, fetchProduct, fetchProductListings } = useAdmin();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [activeVariationIndex, setActiveVariationIndex] = useState<number | null>(null);
  const [showLightbox, setShowLightbox] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    comment: '',
    name: user?.name || '',
    phone: user?.phone || ''
  });
  const [product, setProduct] = useState<typeof products[number] | null>(() => products.find(p => p.id === key || p.sku === key) ?? null);
  const [isLoadingProduct, setIsLoadingProduct] = useState(!product);
  const [prevKey, setPrevKey] = useState(key);

  // Instantly reset state if route key changes
  if (key !== prevKey) {
    setPrevKey(key);
    const cached = products.find(p => p.id === key || p.sku === key);
    setProduct(cached ?? null);
    setIsLoadingProduct(!cached);
  }
  const [relatedProducts, setRelatedProducts] = useState<typeof products>([]);

  React.useEffect(() => {
    if (user) {
      setReviewForm(prev => ({
        ...prev,
        name: user.name,
        phone: user.phone
      }));
    }
  }, [user]);

  React.useEffect(() => {
    let cancelled = false;
    const cached = products.find(p => p.id === key || p.sku === key);
    if (cached) {
      setProduct(cached);
      setIsLoadingProduct(false);
      return;
    }

    const load = async () => {
      if (!key) return;
      setIsLoadingProduct(true);
      const loaded = await fetchProduct(key);
      if (!cancelled) {
        setProduct(loaded);
        setIsLoadingProduct(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [key, products, fetchProduct]);

  React.useEffect(() => {
    if (!product) return;
    let cancelled = false;
    fetchProductListings({ categories: product.category, limit: 4, page: 1, sort: 'rating' })
      .then(response => {
        if (!cancelled) setRelatedProducts(response.items as typeof products);
      })
      .catch(console.error);
    return () => { cancelled = true; };
  }, [product?.id, product?.category, fetchProductListings]);

  React.useEffect(() => {
    if (!product) return;

    trackViewItem({
      id: product.id,
      name: product.name,
      price: product.discountPrice || product.price,
      category: product.category,
      sku: product.sku || undefined,
      stock: product.stock,
      productType: product.productType || 'simple',
      itemBrand: product.badge || undefined,
      index: 1,
      affiliation: window.location.hostname,
      googleBusinessVertical: 'retail',
    });
  }, [product?.id]);

  React.useEffect(() => {
    if (product && product.productType === 'variation' && (product.variations || []).length > 0 && activeVariationIndex === null) {
      const def = (product.variations || []).findIndex(v => v.isDefault);
      setActiveVariationIndex(def >= 0 ? def : 0);
    }
  }, [product, activeVariationIndex]);

  React.useEffect(() => {
    setActiveImage(0);
  }, [activeVariationIndex]);

  const isTransitioning = product && key && product.id !== key && product.sku !== key;

  if (isLoadingProduct || !product || isTransitioning) {
    if (!isLoadingProduct && !product) {
      return <div className="py-20 text-center font-bold text-xl">Product not found.</div>;
    }
    return (
      <div className="container mx-auto px-4 py-8 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          <div className="space-y-4">
            <div className="w-full aspect-square bg-gray-100 rounded-[40px]"></div>
            <div className="flex gap-4">
              {[1, 2, 3, 4].map(i => <div key={i} className="w-20 h-20 bg-gray-100 rounded-2xl"></div>)}
            </div>
          </div>
          <div className="space-y-6 pt-4">
            <div className="h-4 bg-gray-100 w-24 rounded-full"></div>
            <div className="h-10 bg-gray-100 w-3/4 rounded-full"></div>
            <div className="flex gap-4">
              <div className="h-8 bg-gray-100 w-32 rounded-full"></div>
              <div className="h-8 bg-gray-100 w-32 rounded-full"></div>
            </div>
            <div className="h-12 bg-gray-100 w-1/3 rounded-full mt-8"></div>
            <div className="space-y-2 mt-8">
              <div className="h-4 bg-gray-100 w-full rounded"></div>
              <div className="h-4 bg-gray-100 w-full rounded"></div>
              <div className="h-4 bg-gray-100 w-2/3 rounded"></div>
            </div>
            <div className="flex gap-4 mt-8">
              <div className="h-16 bg-gray-100 w-32 rounded-2xl"></div>
              <div className="h-16 bg-gray-100 flex-1 rounded-2xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const images = product.images || [];
  const selectedVariation = product.productType === 'variation' && product.variations && product.variations.length > 0 && (activeVariationIndex !== null) ? product.variations[activeVariationIndex] : undefined;
  const normalizeSrc = (src?: string | null) => normalizeMediaSrc(src);

  const normalizeMedia = (media?: string | string[] | null) => {
    if (!media) return [] as string[];
    if (Array.isArray(media)) return media.map(m => String(m)).filter(Boolean);
    if (typeof media === 'string') return media ? [media] : [];
    return [];
  };

  const productGallery = normalizeMedia(images);
  const variationGallery = normalizeMedia(selectedVariation?.media);
  const gallery = selectedVariation ? (variationGallery.length ? variationGallery : productGallery) : productGallery;
  const displayImage = normalizeSrc(gallery[activeImage] ?? gallery[0] ?? null);
  const displayPrice = selectedVariation?.discountPrice ?? selectedVariation?.price ?? product.discountPrice ?? product.price;
  const basePrice = selectedVariation?.price ?? product.price;

  const handleBuyNowDirect = () => {
    if (quantity <= 0) return;
    navigate('/checkout', { state: { buyNowItem: { product, variation: selectedVariation, quantity } } });
  };

  const handleVariationSelect = (index: number) => {
    if (activeVariationIndex !== index) setQuantity(0);
    setActiveVariationIndex(index);
    setActiveImage(0);
  };

  const handleAddToCartDirect = () => {
    if (quantity <= 0) return;
    addToCart(product, quantity, true, selectedVariation);
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

  const relatedProductsToRender = relatedProducts.filter(p => p.id !== product.id).slice(0, 4);

  return (
    <div className="container mx-auto px-2 py-4 space-y-8 md:px-3 md:py-5">
      <div className="grid grid-cols-1 lg:grid-cols-[45%_55%] gap-4 md:gap-0 bg-white px-0 py-0 rounded-3xl shadow-sm border border-gray-100">
        {/* Images */}
        <div className="space-y-0 flex flex-col items-stretch w-full">
            <div onClick={() => setShowLightbox(true)} role="button" aria-label="Open image" className="w-full aspect-square bg-gray-50 rounded-none overflow-hidden border-0 flex items-center justify-center cursor-zoom-in m-0 mt-0 ml-0 mr-0">
              {displayImage ? (
                extractYouTubeId(displayImage) ? (
                  <iframe
                    src={getYouTubeEmbedUrl(displayImage) || ''}
                    title={product.name}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  />
                ) : displayImage.match(/\.(mp4|webm|ogg|mov)$/i) ? (
                  <video src={displayImage} controls className="w-full h-full object-contain bg-black" />
                ) : (
                  <img src={displayImage} alt={product.name} className="w-full h-full object-contain" />
                )
              ) : (
                <div className="text-gray-400">No image available</div>
              )}
            </div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 w-full px-2 pt-2">
            {(gallery || []).map((img, idx) => {
              const safeImg = normalizeSrc(String(img));
              return (
                <button 
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  className={`w-20 h-20 rounded-lg border-2 overflow-hidden shrink-0 relative ${activeImage === idx ? 'border-primary' : 'border-gray-200 opacity-60 hover:opacity-100'}`}
                >
                  {safeImg ? (
                    extractYouTubeId(safeImg) ? (
                      <>
                        <img src={`https://img.youtube.com/vi/${extractYouTubeId(safeImg)}/hqdefault.jpg`} alt="YouTube thumbnail" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                          <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center text-black text-sm font-black">▶</div>
                        </div>
                      </>
                    ) : safeImg.match(/\.(mp4|webm|ogg|mov)$/i) ? (
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
        <div className="flex flex-col px-3 md:px-4">
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
            <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2">{product.name}{selectedVariation ? ` (${selectedVariation.name})` : ''}</h1>
            {product.shortDescription && <p className="text-sm text-gray-500 mb-4 leading-relaxed max-w-lg">{product.shortDescription}</p>}
            <div className="flex flex-col md:flex-row items-start md:items-center gap-3 mb-6">
              <div className="flex items-center gap-2">
                <div className="flex items-center">
                  {[0,1,2,3,4].map(i => (
                    <Star key={i} size={16} className={i < Math.round(product.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} />
                  ))}
                </div>
                <span className="font-bold">{product.rating}</span>
                <span className="text-gray-400 text-sm">({product.reviews.length} Reviews)</span>
              </div>
              <div className="hidden md:block h-4 w-px bg-gray-200" />
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
                <div className="flex flex-nowrap md:flex-wrap items-center gap-3 overflow-x-auto md:overflow-visible no-scrollbar pb-2">
                  {product.variations.map((v, idx) => {
                    // media can be array or string; extract first URL
                    const varMediaArr = Array.isArray(v.media) ? v.media : (v.media ? [String(v.media)] : []);
                    const varMediaSrc = varMediaArr.length > 0 ? varMediaArr[0] : null;
                    return (
                    <div key={idx} className="flex-none flex flex-col items-center min-w-[72px]">
                      <button onClick={() => handleVariationSelect(idx)} className={`w-16 h-16 rounded-lg border overflow-hidden ${activeVariationIndex === idx ? 'border-primary' : 'border-gray-200'}`}>
                        {varMediaSrc ? (
                          varMediaSrc.match(/\.(mp4|webm|ogg|mov)$/i) ? (
                            <video src={varMediaSrc} className="w-full h-full object-cover" />
                          ) : (
                            <img src={varMediaSrc} alt={v.name} className="w-full h-full object-cover" />
                          )
                        ) : images[0] ? (
                          <img src={images[0]} alt={v.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">No preview</div>
                        )}
                      </button>
                      <span className="text-xs mt-1 text-gray-600 text-center max-w-[70px] line-clamp-1">{v.name}</span>
                    </div>
                  )})}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-6">
              <span className="font-bold text-sm text-gray-500 uppercase tracking-wider">Quantity:</span>
              <div className="flex items-center border-2 border-gray-100 rounded-xl overflow-hidden">
                <button onClick={() => setQuantity(Math.max(0, quantity - 1))} disabled={quantity <= 0} className="p-3 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"><Minus size={18} /></button>
                <span className="px-6 font-bold">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="p-3 hover:bg-gray-100"><Plus size={18} /></button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
                <button 
                onClick={handleAddToCartDirect}
                disabled={quantity <= 0}
                className="flex-1 bg-gray-900 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-gray-800 transition-all text-lg shadow-lg shadow-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingCart size={22} /> Add to Cart
              </button>
              <button 
                onClick={handleBuyNowDirect}
                disabled={quantity <= 0}
                className="flex-1 bg-primary text-white py-4 rounded-xl font-bold flex items-center justify-center gap-3 hover-primary-dark transition-all text-lg shadow-lg shadow-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
            <div
              className="prose prose-gray max-w-none rich-description"
              dangerouslySetInnerHTML={{ __html: sanitizeRichText(product.description || '') }}
            />
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

        {/* Lightbox Modal */}
        <AnimatePresence>
          {showLightbox && (
            <div onClick={() => setShowLightbox(false)} className="fixed inset-0 z-[300] flex items-center justify-center overflow-y-auto">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowLightbox(false)}
                className="fixed inset-0 bg-black/75 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={(e: any) => e.stopPropagation()}
                className="relative z-10 w-full min-h-screen flex items-center justify-center p-4"
              >
                <button onClick={() => setShowLightbox(false)} className="fixed top-4 right-4 z-20 text-white bg-black/40 p-2 rounded-full hover:bg-black/60">
                  <X size={20} />
                </button>
                {displayImage && displayImage.match(/\.(mp4|webm|ogg|mov)$/i) ? (
                  <video src={displayImage} controls autoPlay className="max-w-full max-h-[90vh] object-contain" />
                ) : (
                  <img src={displayImage ?? ''} alt={product.name} className="max-w-full max-h-[90vh] object-contain" />
                )}
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
              <div className="flex flex-col gap-3">
                 {relatedProductsToRender.map(p => {
                   const displayVar = p.productType === 'variation' ? (p.variations?.find(v => v.isDefault) ?? p.variations?.[0]) : undefined;
                   const displayPrice = displayVar?.discountPrice ?? displayVar?.price ?? p.discountPrice ?? p.price;
                   const displayBasePrice = displayVar?.discountPrice ? displayVar.price : (p.discountPrice ? p.price : undefined);
                   const rawImg = p.productType === 'variation'
                     ? (Array.isArray(displayVar?.media) ? displayVar?.media[0] : displayVar?.media)
                     : (p.images?.[0] ?? (p.variations?.[0]?.media ? (Array.isArray(p.variations[0].media) ? p.variations[0].media[0] : p.variations[0].media) : null));
                   const img = normalizeSrc(String(rawImg || ''));
                   const ytId = extractYouTubeId(img);

                   return (
                   <Link 
                     key={p.id} 
                     to={`/product/${encodeURIComponent(p.sku || p.id)}`}
                     className="flex items-center gap-4 p-3 rounded-2xl border border-gray-100 hover:border-primary hover:shadow-md transition-all group bg-white"
                   >
                     <div className="w-20 h-20 shrink-0 rounded-xl overflow-hidden bg-gray-50 flex items-center justify-center relative">
                        {ytId ? (
                          <div className="relative w-full h-full">
                            <img src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`} alt={p.name} loading="lazy" decoding="async" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                              <Play className="text-white fill-white" size={24} />
                            </div>
                          </div>
                        ) : img && img.match(/\.(mp4|webm|ogg|mov)$/i) ? (
                          <div className="relative w-full h-full">
                            <video src={img} preload="metadata" muted playsInline loop className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                              <Play className="text-white fill-white" size={24} />
                            </div>
                          </div>
                        ) : img ? (
                          <img src={img} alt={p.name} loading="lazy" decoding="async" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                        ) : (
                          <div className="text-[10px] text-gray-400">No image</div>
                        )}
                        {displayBasePrice && displayPrice < displayBasePrice && (
                          <div className="absolute top-1 left-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                            -{Math.round(((displayBasePrice - displayPrice) / displayBasePrice) * 100)}%
                          </div>
                        )}
                     </div>
                     <div className="flex-1 min-w-0 flex flex-col justify-center">
                       <h4 className="font-bold text-sm text-gray-800 line-clamp-2 group-hover:text-primary transition-colors leading-tight mb-1">{p.name}</h4>
                       <div className="flex items-center gap-2">
                         <span className="font-black text-primary text-sm">৳{displayPrice}</span>
                         {displayBasePrice && displayPrice < displayBasePrice && (
                           <span className="text-xs text-gray-400 line-through">৳{displayBasePrice}</span>
                         )}
                       </div>
                     </div>
                   </Link>
                 );
                 })}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
