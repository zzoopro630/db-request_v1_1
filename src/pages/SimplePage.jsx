import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import emailjs from '@emailjs/browser';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Trash2 } from 'lucide-react';

const affiliations = ["GOAT", "감동", "다올", "다원", "달", "라온", "유럽", "직할", "캐슬", "해성", "혜윰"];
const regions = ["수도권(서울,인천,경기)", "대전/충청", "광주/전남", "전북", "대구/경북", "부산/울산/경남", "강원", "제주"];
const companyTypes = {
  A: [{ name: "보장분석", price: 80000 }],
  B: [
    { name: "보장분석/3주납품", price: 75000 },
    { name: "보장분석/실버", price: 50000 },
    { name: "보장분석/중장년", price: 85000 },
    { name: "보장분석/여성100%", price: 80000 },
    { name: "보장분석/보험료20만원이상", price: 85000 },
    { name: "보장분석/방문확정", price: 90000 },
    { name: "보장분석/화재보험", price: 75000 },
  ]
};

const SimplePage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', affiliation: '', phone: '010-', email: '' });
  const [selectedItems, setSelectedItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [displayErrors, setDisplayErrors] = useState({});
  const [emailKoreanWarning, setEmailKoreanWarning] = useState('');
  const [nameEnglishWarning, setNameEnglishWarning] = useState('');

  // Simplified state for DB selection
  const [selectedDbType, setSelectedDbType] = useState('A');
  const [selectedType, setSelectedType] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');

  useEffect(() => {
    const newTotal = selectedItems.reduce((sum, item) => sum + item.total, 0);
    setTotal(newTotal);
  }, [selectedItems]);

  useEffect(() => {
    const koreanRegex = /[ㄱ-ㅎ|가-힣]/;
    if (koreanRegex.test(formData.email)) {
        setEmailKoreanWarning('이메일 주소에는 한글을 사용할 수 없습니다.');
    } else {
        setEmailKoreanWarning('');
    }
  }, [formData.email]);

  useEffect(() => {
    const englishRegex = /[a-zA-Z]/;
    if (englishRegex.test(formData.name)) {
        setNameEnglishWarning('이름에는 영문을 사용할 수 없습니다.');
    } else {
        setNameEnglishWarning('');
    }
  }, [formData.name]);

  const handleAddItem = () => {
    if (!selectedType || !selectedRegion) return;

    const itemExists = selectedItems.some(item => 
        item.dbType === selectedDbType && 
        item.region === selectedRegion && 
        item.type === selectedType
    );

    if (!itemExists) {
        const typeInfo = companyTypes[selectedDbType].find(t => t.name === selectedType);
        if (!typeInfo) return;

        const newItem = {
            id: Date.now(),
            dbType: selectedDbType,
            name: `${selectedDbType}업체 - ${selectedType} (${selectedRegion})`,
            region: selectedRegion,
            type: selectedType,
            quantity: 1,
            price: typeInfo.price,
            total: typeInfo.price
        };
        setSelectedItems(prev => [...prev, newItem]);
    }
    
    setSelectedType('');
    setSelectedRegion('');
  };

  const handleInputChange = (e) => {
    setDisplayErrors({});
    const { name, value } = e.target;
    if (name === 'phone') {
        const digits = value.replace(/[^\d]/g, '').substring(3);
        let formattedPhone = '010-';
        if (digits.length > 0) {
            formattedPhone += digits.substring(0, 4);
        }
        if (digits.length > 4) {
            formattedPhone += '-' + digits.substring(4, 8);
        }
        setFormData(prev => ({ ...prev, phone: formattedPhone }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSelectChange = (name, value) => {
    setDisplayErrors({});
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleQuantityChangeInList = (id, newQuantity) => {
    const quantity = Math.max(0, parseInt(newQuantity, 10) || 0);
    
    setSelectedItems(prevItems => 
        prevItems.map(item => {
            if (item.id === id) {
                return {
                    ...item,
                    quantity: quantity,
                    total: quantity * item.price
                };
            }
            return item;
        }).filter(item => item.quantity > 0)
    );
  };

  const handleRemoveItem = (id) => {
    setSelectedItems(prev => prev.filter(item => item.id !== id));
  };

  const validate = () => {
      const newErrors = {};
      if (!formData.name || nameEnglishWarning) newErrors.name = "이름을 확인해주세요";
      if (!formData.affiliation) newErrors.affiliation = "소속을 확인해주세요";
      if (!/^010-\d{4}-\d{4}$/.test(formData.phone)) newErrors.phone = "전화번호를 확인해주세요";
      if (!formData.email || emailKoreanWarning) newErrors.email = "이메일을 입력해주세요";
      if (selectedItems.length === 0) newErrors.items = "하나 이상의 DB를 신청내역에 추가해주세요.";
      return newErrors;
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
        setDisplayErrors(validationErrors);
        return;
    }
    
    setDisplayErrors({});
    setIsSubmitting(true);

    const serviceID = 'service_gf7tr94';
    const templateID = 'template_5wlvuso';
    const publicKey = 'si6sUamB5hB5f3V6d';

    const itemsSummary = selectedItems.map(item => 
        `${item.name} - 수량: ${item.quantity}, 금액: ${item.total.toLocaleString()}원`
    ).join('<br>');

    const templateParams = { 
        ...formData,
        items_summary: itemsSummary, 
        total: total.toLocaleString(), 
        to_email: formData.email, 
        admin_email: 'songnakjoo@gmail.com' 
    };
    
    emailjs.init(publicKey);
    emailjs.send(serviceID, templateID, templateParams)
      .then((response) => {
        console.log('SUCCESS! - Admin', response.status, response.text);
        navigate('/order-confirmation');
      }, (err) => {
        console.error('FAILED... - Admin', err);
        setDisplayErrors({ submit: `관리자 이메일 발송에 실패했습니다: ${err.text}` });
        setIsSubmitting(false);
      });
  };

  return (
    <div className="min-h-screen bg-white p-4">
      <div className="max-w-2xl mx-auto pt-8">
        <Card className="border border-gray-300">
          <CardHeader>
            <CardTitle className="text-4xl text-center">퍼스트 DB 신청</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="p-4 border rounded-md space-y-4">
                <h3 className="font-semibold">DB 선택</h3>
                <RadioGroup value={selectedDbType} onValueChange={(v) => {setSelectedDbType(v); setSelectedType(''); setSelectedRegion('');}} className="flex space-x-4">
                    <div className="flex items-center space-x-2"><RadioGroupItem value="A" id="db-a" /><Label htmlFor="db-a">A업체</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="B" id="db-b" /><Label htmlFor="db-b">B업체</Label></div>
                </RadioGroup>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <Label>유형</Label>
                        <Select value={selectedType || undefined} onValueChange={setSelectedType}><SelectTrigger><SelectValue placeholder="유형 선택" /></SelectTrigger><SelectContent>{companyTypes[selectedDbType].map(t => <SelectItem key={t.name} value={t.name}>{t.name}</SelectItem>)}</SelectContent></Select>
                    </div>
                    <div className="space-y-1">
                        <Label>지역</Label>
                        <Select value={selectedRegion || undefined} onValueChange={setSelectedRegion}><SelectTrigger><SelectValue placeholder="지역 선택" /></SelectTrigger><SelectContent>{regions.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select>
                    </div>
                </div>
                <Button type="button" onClick={handleAddItem} disabled={!selectedType || !selectedRegion} className="w-full">신청 내역에 추가</Button>
              </div>

              {selectedItems.length > 0 && (
                <div className="p-4 border rounded-md space-y-2">
                    <h3 className="font-semibold">신청 내역</h3>
                    {selectedItems.map((item, index) => (
                        <div key={item.id} className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
                            <span className="w-2/5">{index + 1}. {item.name}</span>
                            <div className="flex items-center gap-2 w-3/5 justify-end">
                                <div className="flex items-center">
                                    <Button type="button" variant="outline" size="icon" className="h-8 w-8 rounded-r-none" onClick={() => handleQuantityChangeInList(item.id, item.quantity - 1)}>-</Button>
                                    <Input 
                                        id={`quantity-${item.id}`}
                                        type="number" 
                                        value={item.quantity} 
                                        onChange={(e) => handleQuantityChangeInList(item.id, e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                                        className="w-12 h-8 text-center rounded-none border-l-0 border-r-0"
                                        min="0"
                                    />
                                    <Button type="button" variant="outline" size="icon" className="h-8 w-8 rounded-l-none" onClick={() => handleQuantityChangeInList(item.id, item.quantity + 1)}>+</Button>
                                </div>
                                <span className="w-28 text-right">{item.total.toLocaleString()}원</span>
                                <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveItem(item.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                            </div>
                        </div>
                    ))}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="name">이름</Label>
                  <Input id="name" name="name" type="text" value={formData.name} onChange={handleInputChange} placeholder="한글로 입력하세요" />
                  {nameEnglishWarning && <p className="text-sm text-yellow-600 mt-1">{nameEnglishWarning}</p>}
                  {displayErrors.name && <p className="text-sm text-red-500">{displayErrors.name}</p>}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="affiliation">소속</Label>
                  <Select name="affiliation" onValueChange={(value) => handleSelectChange('affiliation', value)}><SelectTrigger><SelectValue placeholder="소속을 선택하세요" /></SelectTrigger><SelectContent>{affiliations.map(aff => <SelectItem key={aff} value={aff}>{aff}</SelectItem>)}</SelectContent></Select>
                  {displayErrors.affiliation && <p className="text-sm text-red-500">{displayErrors.affiliation}</p>}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="phone">전화번호</Label>
                  <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleInputChange} placeholder="010-0000-0000" />
                  {displayErrors.phone && <p className="text-sm text-red-500">{displayErrors.phone}</p>}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="email">이메일</Label>
                  <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} placeholder="이메일을 입력하세요" />
                  {emailKoreanWarning && <p className="text-sm text-yellow-600 mt-1">{emailKoreanWarning}</p>}
                  {displayErrors.email && <p className="text-sm text-red-500 mt-1">{displayErrors.email}</p>}
                </div>
              </div>

              {displayErrors.items && <p className="text-sm text-red-500 text-center">{displayErrors.items}</p>}
              
              <div className="text-xl font-bold text-right">
                총 금액: {total.toLocaleString()}원
              </div>

              <Button type="submit" className="w-full text-white btn-gradient-flow transition-transform duration-300 hover:scale-105" disabled={isSubmitting || selectedItems.length === 0 || !!emailKoreanWarning || !!nameEnglishWarning}>
                {isSubmitting ? '신청하는 중...' : '신청하기'}
              </Button>
              {displayErrors.submit && <p className="text-sm text-red-500 text-center">{displayErrors.submit}</p>}
            </form>
            <div className="mt-8 flex justify-center">
                <img src="/logo_black.png" alt="Logo" className="h-7" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SimplePage;