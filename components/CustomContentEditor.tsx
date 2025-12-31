'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { CustomContent } from '@/lib/types';

interface CustomContentEditorProps {
  businessId: string;
  initialContent?: CustomContent | null;
  onSave: () => Promise<void>;
}

export default function CustomContentEditor({ businessId, initialContent, onSave }: CustomContentEditorProps) {
  const [content, setContent] = useState<CustomContent>(() => ({
    menuButtonImageUrl: initialContent?.menuButtonImageUrl || '',
    promotions: initialContent?.promotions || [],
    events: initialContent?.events || { enabled: false, title: '', description: '', formFields: [] },
    contact: initialContent?.contact || { enabled: false, title: '', description: '', phone: '', email: '', whatsapp: '', instagram: '', facebook: '' },
    loyaltyClub: initialContent?.loyaltyClub || { enabled: false, title: '', description: '', benefits: [] },
    reviews: initialContent?.reviews || { enabled: false, googleReviewsUrl: '' },
  }));

  const [saving, setSaving] = useState(false);

  // Update content when initialContent changes (after save) - only if values actually changed
  useEffect(() => {
    setContent((prevContent) => {
      if (!initialContent) {
        // Only reset if current content is not already empty
        const isEmpty = !prevContent.menuButtonImageUrl && 
                       (!prevContent.promotions || prevContent.promotions.length === 0) &&
                       (!prevContent.contact || !prevContent.contact.enabled) &&
                       (!prevContent.loyaltyClub || !prevContent.loyaltyClub.enabled) &&
                       (!prevContent.reviews || !prevContent.reviews.enabled);
        if (isEmpty) {
          return prevContent; // No change needed
        }
        return {
          promotions: [],
          events: { enabled: false, title: '', description: '', formFields: [] },
          contact: { enabled: false, title: '', description: '', phone: '', email: '', whatsapp: '', instagram: '', facebook: '' },
          loyaltyClub: { enabled: false, title: '', description: '', benefits: [] },
          menuButtonImageUrl: '',
          reviews: { enabled: false, googleReviewsUrl: '' },
        };
      }

      // Deep comparison - only update if values actually changed
      const currentStr = JSON.stringify({
        menuButtonImageUrl: prevContent.menuButtonImageUrl || '',
        promotions: prevContent.promotions || [],
        events: prevContent.events || { enabled: false, title: '', description: '', formFields: [] },
        contact: prevContent.contact || { enabled: false, title: '', description: '', phone: '', email: '', whatsapp: '', instagram: '', facebook: '' },
        loyaltyClub: prevContent.loyaltyClub || { enabled: false, title: '', description: '', benefits: [] },
        reviews: prevContent.reviews || { enabled: false, googleReviewsUrl: '' },
      });

      const newStr = JSON.stringify({
        menuButtonImageUrl: initialContent.menuButtonImageUrl || '',
        promotions: initialContent.promotions || [],
        events: initialContent.events || { enabled: false, title: '', description: '', formFields: [] },
        contact: initialContent.contact || { enabled: false, title: '', description: '', phone: '', email: '', whatsapp: '', instagram: '', facebook: '' },
        loyaltyClub: initialContent.loyaltyClub || { enabled: false, title: '', description: '', benefits: [] },
        reviews: initialContent.reviews || { enabled: false, googleReviewsUrl: '' },
      });

      // Only update if values actually changed
      if (currentStr !== newStr) {
        return {
          promotions: initialContent.promotions || [],
          events: initialContent.events || { enabled: false, title: '', description: '', formFields: [] },
          contact: initialContent.contact || { enabled: false, title: '', description: '', phone: '', email: '', whatsapp: '', instagram: '', facebook: '' },
          loyaltyClub: initialContent.loyaltyClub || { enabled: false, title: '', description: '', benefits: [] },
          menuButtonImageUrl: initialContent.menuButtonImageUrl || '',
          reviews: initialContent.reviews || { enabled: false, googleReviewsUrl: '' },
        };
      }

      return prevContent; // No change needed
    });
  }, [initialContent]);

  const handleSave = async () => {
    try {
      setSaving(true);
      console.log('💾 Saving customContent:', JSON.stringify(content, null, 2));
      console.log('💾 BusinessId:', businessId);
      
      const requestBody = {
        businessId,
        customContent: content,
      };
      console.log('💾 Request body:', JSON.stringify(requestBody, null, 2));
      
      const res = await fetch('/api/business/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      
      const data = await res.json();
      console.log('📥 API Response status:', res.status);
      console.log('📥 API Response:', JSON.stringify(data, null, 2));
      
      if (!res.ok) {
        console.error('❌ API Error:', data);
        throw new Error(data.message || data.details || 'נכשל בעדכון התוכן');
      }
      
      console.log('✅ Save successful, reloading business info...');
      await onSave();
      console.log('✅ Business info reloaded');
      toast.success('התוכן עודכן בהצלחה!');
    } catch (err: any) {
      console.error('❌ Save error:', err);
      console.error('❌ Error stack:', err.stack);
      toast.error(err.message || 'נכשל בעדכון התוכן');
    } finally {
      setSaving(false);
    }
  };

  const addPromotion = () => {
    setContent({
      ...content,
      promotions: [
        ...(content.promotions || []),
        {
          id: Date.now().toString(),
          title: '',
          titleEn: '',
          description: '',
          descriptionEn: '',
          imageUrl: '',
          validUntil: '',
          enabled: true,
        },
      ],
    });
  };

  const removePromotion = (id: string) => {
    setContent({
      ...content,
      promotions: (content.promotions || []).filter((p) => p.id !== id),
    });
  };

  const updatePromotion = (id: string, field: string, value: any) => {
    setContent({
      ...content,
      promotions: (content.promotions || []).map((p) =>
        p.id === id ? { ...p, [field]: value } : p
      ),
    });
  };

  const addBenefit = () => {
    setContent({
      ...content,
      loyaltyClub: {
        ...content.loyaltyClub!,
        benefits: [...(content.loyaltyClub?.benefits || []), { text: '', textEn: '' }],
      },
    });
  };

  const removeBenefit = (index: number) => {
    setContent({
      ...content,
      loyaltyClub: {
        ...content.loyaltyClub!,
        benefits: (content.loyaltyClub?.benefits || []).filter((_, i) => i !== index),
      },
    });
  };

  const updateBenefit = (index: number, field: 'text' | 'textEn', value: string) => {
    setContent({
      ...content,
      loyaltyClub: {
        ...content.loyaltyClub!,
        benefits: (content.loyaltyClub?.benefits || []).map((b, i) =>
          i === index ? { ...b, [field]: value } : b
        ),
      },
    });
  };

  return (
    <div className="space-y-8">
      {/* Menu Button Image Section */}
      <div className="space-y-4">
        <div>
          <h3 className="text-base font-semibold text-white">תמונת רקע לכפתור התפריט</h3>
          <p className="text-xs text-neutral-400 mt-0.5">תמונה שתוצג ברקע כפתור "צפה בתפריט" (אופציונלי)</p>
        </div>
        <div>
          <label className="block text-xs text-neutral-300 mb-1.5">קישור לתמונה (URL)</label>
          <input
            type="url"
            value={content.menuButtonImageUrl || ''}
            onChange={(e) =>
              setContent({
                ...content,
                menuButtonImageUrl: e.target.value,
              })
            }
            className="w-full rounded-lg bg-neutral-800/80 border border-neutral-700/50 px-3 py-2 text-sm text-white"
            placeholder="https://example.com/image.jpg"
          />
          <p className="text-xs text-neutral-500 mt-1">התמונה תוצג ברקע עם overlay כדי שהטקסט יישאר קריא</p>
          {content.menuButtonImageUrl && (
            <div className="mt-3">
              <img
                src={content.menuButtonImageUrl}
                alt="Preview"
                className="w-full h-32 object-cover rounded-lg border border-neutral-700/50"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Promotions Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-white">מבצעים</h3>
            <p className="text-xs text-neutral-400 mt-0.5">הוסף מבצעים שיוצגו בתפריט</p>
          </div>
          <button
            type="button"
            onClick={addPromotion}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition"
          >
            + הוסף
          </button>
        </div>

        <div className="space-y-3">
          {content.promotions?.map((promo) => (
            <div key={promo.id} className="border-b border-neutral-800/50 pb-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={promo.enabled}
                    onChange={(e) => updatePromotion(promo.id, 'enabled', e.target.checked)}
                    className="w-4 h-4 rounded border-neutral-600 bg-neutral-800 text-blue-500"
                  />
                  <span className="text-sm font-medium text-white">מבצע פעיל</span>
                </label>
                <button
                  type="button"
                  onClick={() => removePromotion(promo.id)}
                  className="text-red-400 hover:text-red-300 text-sm"
                >
                  מחק
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-neutral-300 mb-1">כותרת (עברית)</label>
                  <input
                    type="text"
                    value={promo.title}
                    onChange={(e) => updatePromotion(promo.id, 'title', e.target.value)}
                    className="w-full rounded-lg bg-neutral-800/80 border border-neutral-700/50 px-3 py-2 text-sm text-white"
                    placeholder="כותרת המבצע"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-300 mb-1">כותרת (אנגלית)</label>
                  <input
                    type="text"
                    value={promo.titleEn || ''}
                    onChange={(e) => updatePromotion(promo.id, 'titleEn', e.target.value)}
                    className="w-full rounded-lg bg-neutral-800/80 border border-neutral-700/50 px-3 py-2 text-sm text-white"
                    placeholder="Promotion Title"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-neutral-300 mb-1">תיאור (עברית)</label>
                <textarea
                  value={promo.description}
                  onChange={(e) => updatePromotion(promo.id, 'description', e.target.value)}
                  className="w-full rounded-lg bg-neutral-800/80 border border-neutral-700/50 px-3 py-2 text-sm text-white"
                  rows={2}
                  placeholder="תיאור המבצע"
                />
              </div>

              <div>
                <label className="block text-xs text-neutral-300 mb-1">תיאור (אנגלית)</label>
                <textarea
                  value={promo.descriptionEn || ''}
                  onChange={(e) => updatePromotion(promo.id, 'descriptionEn', e.target.value)}
                  className="w-full rounded-lg bg-neutral-800/80 border border-neutral-700/50 px-3 py-2 text-sm text-white"
                  rows={2}
                  placeholder="Promotion Description"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-neutral-300 mb-1">קישור לתמונה (URL)</label>
                  <input
                    type="url"
                    value={promo.imageUrl || ''}
                    onChange={(e) => updatePromotion(promo.id, 'imageUrl', e.target.value)}
                    className="w-full rounded-lg bg-neutral-800/80 border border-neutral-700/50 px-3 py-2 text-sm text-white"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-300 mb-1">תוקף עד (תאריך)</label>
                  <input
                    type="date"
                    value={promo.validUntil || ''}
                    onChange={(e) => updatePromotion(promo.id, 'validUntil', e.target.value)}
                    className="w-full rounded-lg bg-neutral-800/80 border border-neutral-700/50 px-3 py-2 text-sm text-white"
                  />
                </div>
              </div>
            </div>
          ))}

          {(!content.promotions || content.promotions.length === 0) && (
            <p className="text-xs text-neutral-500 text-center py-3">אין מבצעים</p>
          )}
        </div>
      </div>

      {/* Contact Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-white">יצירת קשר</h3>
            <p className="text-xs text-neutral-400 mt-0.5">פרטי יצירת קשר שיוצגו בתפריט</p>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={content.contact?.enabled || false}
              onChange={(e) => {
                setContent({
                  ...content,
                  contact: { ...content.contact!, enabled: e.target.checked },
                });
              }}
              className="w-4 h-4 rounded border-neutral-600 bg-neutral-800 text-blue-500"
            />
            <span className="text-sm text-white">הצג</span>
          </label>
        </div>

        {content.contact?.enabled && (
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-neutral-300 mb-1">כותרת (עברית)</label>
                <input
                  type="text"
                  value={content.contact.title || ''}
                  onChange={(e) => {
                    const newContact = { ...content.contact!, title: e.target.value };
                    const newContent = { ...content, contact: newContact };
                    setContent(newContent);
                  }}
                  className="w-full rounded-lg bg-neutral-800/80 border border-neutral-700/50 px-3 py-2 text-sm text-white"
                  placeholder="יצירת קשר"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-300 mb-1">כותרת (אנגלית)</label>
                <input
                  type="text"
                  value={content.contact.titleEn || ''}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      contact: { ...content.contact!, titleEn: e.target.value },
                    })
                  }
                  className="w-full rounded-lg bg-neutral-800/80 border border-neutral-700/50 px-3 py-2 text-sm text-white"
                  placeholder="Contact Us"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-neutral-300 mb-1">תיאור (עברית)</label>
              <textarea
                value={content.contact.description || ''}
                onChange={(e) =>
                  setContent({
                    ...content,
                    contact: { ...content.contact!, description: e.target.value },
                  })
                }
                className="w-full rounded-lg bg-neutral-800/80 border border-neutral-700/50 px-3 py-2 text-sm text-white"
                rows={2}
                placeholder="תיאור קצר"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-neutral-300 mb-1">טלפון</label>
                <input
                  type="tel"
                  value={content.contact.phone || ''}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      contact: { ...content.contact!, phone: e.target.value },
                    })
                  }
                  className="w-full rounded-lg bg-neutral-800/80 border border-neutral-700/50 px-3 py-2 text-sm text-white"
                  placeholder="03-1234567"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-300 mb-1">אימייל</label>
                <input
                  type="email"
                  value={content.contact.email || ''}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      contact: { ...content.contact!, email: e.target.value },
                    })
                  }
                  className="w-full rounded-lg bg-neutral-800/80 border border-neutral-700/50 px-3 py-2 text-sm text-white"
                  placeholder="info@example.com"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-300 mb-1">WhatsApp</label>
                <input
                  type="text"
                  value={content.contact.whatsapp || ''}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      contact: { ...content.contact!, whatsapp: e.target.value },
                    })
                  }
                  className="w-full rounded-lg bg-neutral-800/80 border border-neutral-700/50 px-3 py-2 text-sm text-white"
                  placeholder="972501234567"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-300 mb-1">Instagram</label>
                <input
                  type="url"
                  value={content.contact.instagram || ''}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      contact: { ...content.contact!, instagram: e.target.value },
                    })
                  }
                  className="w-full rounded-lg bg-neutral-800/80 border border-neutral-700/50 px-3 py-2 text-sm text-white"
                  placeholder="https://instagram.com/..."
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-300 mb-1">Facebook</label>
                <input
                  type="url"
                  value={content.contact.facebook || ''}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      contact: { ...content.contact!, facebook: e.target.value },
                    })
                  }
                  className="w-full rounded-lg bg-neutral-800/80 border border-neutral-700/50 px-3 py-2 text-sm text-white"
                  placeholder="https://facebook.com/..."
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Loyalty Club Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-white">מועדון לקוחות</h3>
            <p className="text-xs text-neutral-400 mt-0.5">הגדר מועדון לקוחות עם הטבות</p>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={content.loyaltyClub?.enabled || false}
              onChange={(e) =>
                setContent({
                  ...content,
                  loyaltyClub: { ...content.loyaltyClub!, enabled: e.target.checked },
                })
              }
              className="w-4 h-4 rounded border-neutral-600 bg-neutral-800 text-blue-500"
            />
            <span className="text-sm text-white">הצג</span>
          </label>
        </div>

        {content.loyaltyClub?.enabled && (
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-neutral-300 mb-1">כותרת (עברית)</label>
                <input
                  type="text"
                  value={content.loyaltyClub.title || ''}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      loyaltyClub: { ...content.loyaltyClub!, title: e.target.value },
                    })
                  }
                  className="w-full rounded-lg bg-neutral-800/80 border border-neutral-700/50 px-3 py-2 text-sm text-white"
                  placeholder="מועדון לקוחות"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-300 mb-1">כותרת (אנגלית)</label>
                <input
                  type="text"
                  value={content.loyaltyClub.titleEn || ''}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      loyaltyClub: { ...content.loyaltyClub!, titleEn: e.target.value },
                    })
                  }
                  className="w-full rounded-lg bg-neutral-800/80 border border-neutral-700/50 px-3 py-2 text-sm text-white"
                  placeholder="Loyalty Club"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-neutral-300 mb-1">תיאור (עברית)</label>
              <textarea
                value={content.loyaltyClub.description || ''}
                onChange={(e) =>
                  setContent({
                    ...content,
                    loyaltyClub: { ...content.loyaltyClub!, description: e.target.value },
                  })
                }
                className="w-full rounded-lg bg-neutral-800/80 border border-neutral-700/50 px-3 py-2 text-sm text-white"
                rows={2}
                placeholder="תיאור מועדון הלקוחות"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs text-neutral-300">הטבות</label>
                <button
                  type="button"
                  onClick={addBenefit}
                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition"
                >
                  + הוסף
                </button>
              </div>
              <div className="space-y-2">
                {content.loyaltyClub.benefits?.map((benefit, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={benefit.text}
                      onChange={(e) => updateBenefit(index, 'text', e.target.value)}
                      className="flex-1 rounded-lg bg-neutral-800/80 border border-neutral-700/50 px-3 py-2 text-sm text-white"
                      placeholder="הטבה (עברית)"
                    />
                    <input
                      type="text"
                      value={benefit.textEn || ''}
                      onChange={(e) => updateBenefit(index, 'textEn', e.target.value)}
                      className="flex-1 rounded-lg bg-neutral-800/80 border border-neutral-700/50 px-3 py-2 text-sm text-white"
                      placeholder="Benefit (English)"
                    />
                    <button
                      type="button"
                      onClick={() => removeBenefit(index)}
                      className="px-3 py-2 text-red-400 hover:text-red-300"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Reviews Section - Google Reviews Only */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-white">ביקורות Google</h3>
            <p className="text-xs text-neutral-400">קישור לביקורות Google בלבד</p>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={content.reviews?.enabled || false}
              onChange={(e) =>
                setContent({
                  ...content,
                  reviews: { ...content.reviews || { enabled: false, googleReviewsUrl: '' }, enabled: e.target.checked },
                })
              }
              className="w-4 h-4 rounded border-neutral-600 bg-neutral-800 text-blue-500"
            />
            <span className="text-sm text-white">הצג</span>
          </label>
        </div>

        {content.reviews?.enabled && (
          <div>
            <label className="block text-xs text-neutral-300 mb-1.5">קישור לביקורות Google</label>
            <input
              type="url"
              value={content.reviews.googleReviewsUrl || ''}
              onChange={(e) =>
                setContent({
                  ...content,
                  reviews: { ...content.reviews!, googleReviewsUrl: e.target.value },
                })
              }
              className="w-full rounded-lg bg-neutral-800/80 border border-neutral-700/50 px-3 py-2 text-sm text-white"
              placeholder="https://g.page/r/..."
            />
            <p className="text-xs text-neutral-500 mt-1">העתק את הקישור מדף העסק ב-Google</p>
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-4 border-t border-neutral-800/50">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition"
        >
          {saving ? 'שומר...' : 'שמור שינויים'}
        </button>
      </div>
    </div>
  );
}

