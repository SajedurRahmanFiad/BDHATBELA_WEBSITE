import React, { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, Send, MessageCircle, Loader2 } from 'lucide-react';
import { useAdmin } from '../AdminContext';
import { useAuth } from '../AuthContext';
import { motion } from 'motion/react';
import { API_BASE_URL } from '../constants';
import { normalizePhone, isValidPhone, handlePhoneChange } from '../utils/phone';
import { trackContact } from '../utils/facebookPixel';

export const Contact: React.FC = () => {
  const { settings } = useAdmin();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [phoneError, setPhoneError] = useState('');

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name,
        phone: user.phone
      }));
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidPhone(formData.phone)) {
      setPhoneError('Please enter a valid 11-digit phone number (e.g. 01XXXXXXXXX)');
      return;
    }
    setPhoneError('');
    setLoading(true);
    try {
      await fetch(`${API_BASE_URL}/contacts.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      setSubmitted(true);
      trackContact();
      setFormData({ 
        name: user?.name || '', 
        phone: user?.phone || '', 
        subject: '', 
        message: '' 
      });
      setTimeout(() => setSubmitted(false), 6000);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const whatsappHref = settings?.whatsappNumber
    ? `https://wa.me/${settings.whatsappNumber.replace(/\D/g, '')}`
    : '#';

  return (
    <div className="container mx-auto px-4 py-20">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-16 space-y-4">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-black tracking-tighter"
          >
            Get in <span className="text-primary italic">Touch with Us</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-gray-500 max-w-2xl mx-auto font-medium"
          >
            Let us know your queries, suggestions, feedback or complaints. Our customer representative team will resolve them shortly.
          </motion.p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Contact Info */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 flex items-start gap-6 group hover:border-primary transition-all">
              <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Phone size={24} />
              </div>
              <div>
                <h3 className="font-bold text-gray-400 text-xs uppercase tracking-widest mb-1">Hotline</h3>
                <p className="text-xl font-black text-gray-900">{settings?.contactPhone}</p>
                <p className="text-xs text-gray-500 mt-1">{settings?.hotlineHours || '10:00 AM to 8:00 PM'}</p>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 flex items-start gap-6 group hover:border-primary transition-all">
              <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Mail size={24} />
              </div>
              <div>
                <h3 className="font-bold text-gray-400 text-xs uppercase tracking-widest mb-1">Email</h3>
                <p className="text-lg font-black text-gray-900">{settings?.email}</p>
                <p className="text-xs text-gray-500 mt-1">Send us an email anytime</p>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 flex items-start gap-6 group hover:border-primary transition-all">
              <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <MapPin size={24} />
              </div>
              <div>
                <h3 className="font-bold text-gray-400 text-xs uppercase tracking-widest mb-1">Office</h3>
                <p className="text-lg font-black text-gray-900">{settings?.address || 'Not provided'}</p>
                <p className="text-xs text-gray-500 mt-1">Visit us during business hours</p>
              </div>
            </div>

            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-primary p-8 rounded-[40px] shadow-xl shadow-red-100 text-white flex items-center justify-between group cursor-pointer hover:bg-black transition-all no-underline"
            >
              <div className="space-y-1">
                <h3 className="font-black text-xl">WhatsApp Us</h3>
                <p className="text-xs opacity-80">Message us directly on WhatsApp</p>
              </div>
              <MessageCircle size={40} className="opacity-40 group-hover:opacity-100 transition-opacity" />
            </a>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white p-10 rounded-[50px] shadow-2xl border border-gray-100"
            >
              {submitted ? (
                <div className="py-20 text-center space-y-6">
                  <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto scale-125">
                    <Send size={40} />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-3xl font-black tracking-tighter">Message Sent!</h2>
                    <p className="text-gray-500 font-medium">We will get back to you as soon as possible. Thank you!</p>
                  </div>
                  <button 
                    onClick={() => setSubmitted(false)}
                    className="text-primary font-bold hover:underline"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Your Name</label>
                      <input 
                        type="text" 
                        required
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        className="w-full bg-gray-50 border-2 border-transparent focus:border-primary px-6 py-4 rounded-3xl outline-none transition-all font-medium"
                        placeholder="e.g. John Doe"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Phone Number</label>
                      <input 
                        type="tel" 
                        required
                        maxLength={11}
                        value={formData.phone}
                        onChange={e => {
                          handlePhoneChange(e.target.value, (v) => setFormData({...formData, phone: v}));
                          setPhoneError('');
                        }}
                        className={`w-full bg-gray-50 border-2 ${phoneError ? 'border-red-400' : 'border-transparent focus:border-primary'} px-6 py-4 rounded-3xl outline-none transition-all font-medium`}
                        placeholder="e.g. 01XXXXXXXXX"
                      />
                      {phoneError && <p className="text-red-500 text-xs font-bold ml-4">{phoneError}</p>}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Subject</label>
                    <input 
                      type="text" 
                      required
                      value={formData.subject}
                      onChange={e => setFormData({...formData, subject: e.target.value})}
                      className="w-full bg-gray-50 border-2 border-transparent focus:border-primary px-6 py-4 rounded-3xl outline-none transition-all font-medium"
                      placeholder="What is this query about?"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Your Message</label>
                    <textarea 
                      required
                      value={formData.message}
                      onChange={e => setFormData({...formData, message: e.target.value})}
                      className="w-full bg-gray-50 border-2 border-transparent focus:border-primary px-6 py-4 rounded-3xl outline-none transition-all font-medium h-40 resize-none"
                      placeholder="Write your details or feedback here..."
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-primary text-white py-5 rounded-3xl font-black text-lg shadow-xl shadow-red-100 hover:bg-black hover:shadow-gray-200 transition-all flex items-center justify-center gap-3 disabled:opacity-70"
                  >
                    {loading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                    {loading ? 'Sending...' : 'Send Message'}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};



