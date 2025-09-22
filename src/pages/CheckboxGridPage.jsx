import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import emailjs from '@emailjs/browser';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2 } from 'lucide-react';

const affiliations = ["GOAT", "감동", "다올", "다원", "달", "라온", "유럽", "직할", "캐슬", "해성", "혜윰"];
const regions = ["서울/인천/경기", "대전/충청", "광주/전남", "전북", "대구/경북", "부산/울산/경남", "강원", "제주"];
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

const CheckboxGridPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', affiliation: '', phone: '010-', email: '' });
  const [selectedItems, setSelectedItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [displayErrors, setDisplayErrors] = useState({});
  const [nameEnglishWarning, setNameEnglishWarning] = useState('');
  const [emailKoreanWarning, setEmailKoreanWarning] = useState('');

  // 체크박스 선택 상태
  const [selections, setSelections] = useState({});

  useEffect(() => {
    const newTotal = selectedItems.reduce((sum, item) => sum + item.total, 0);
    setTotal(newTotal);
  }, [selectedItems]);

  useEffect(() => {
    const englishRegex = /[a-zA-Z]/;
    setNameEnglishWarning(englishRegex.test(formData.name) ? '이름에는 영문을 사용할 수 없습니다.' : '');
  }, [formData.name]);

  useEffect(() => {
    const koreanRegex = /[ㄱ-ㅎ|가-힣]/;
    setEmailKoreanWarning(koreanRegex.test(formData.email) ? '이메일 주소에는 한글을 사용할 수 없습니다.' : '');
  }, [formData.email]);

  const handleCheckboxChange = (dbType, typeName, region, checked) => {
    const key = `${dbType}-${typeName}-${region}`;
    const typeInfo = companyTypes[dbType].find(t => t.name === typeName);
    
    if (checked) {
      // 항목 추가
      const newItem = {
        id: Date.now() + Math.random(),
        dbType,
        name: `${dbType}업체 - ${typeName} (${region})`,
        region,
        type: typeName,
        quantity: 1,
        price: typeInfo.price,
        total: typeInfo.price
      };
      setSelectedItems(prev => [...prev, newItem]);
      setSelections(prev => ({ ...prev, [key]: true }));
    } else {
      // 항목 제거
      setSelectedItems(prev => prev.filter(item => 
        !(item.dbType === dbType && item.type === typeName && item.region === region)
      ));
      setSelections(prev => {
        const newSelections = { ...prev };
        delete newSelections[key];
        return newSelections;
      });
    }
  };

  const handleQuantityChangeInList = (id, newQuantity) => {
    const quantity = Math.max(0, parseInt(newQuantity, 10) || 0);
    setSelectedItems(prevItems => 
        prevItems.map(item => 
            item.id === id ? { ...item, quantity, total: quantity * item.price } : item
        ).filter(item => item.quantity > 0)
    );
  };

  const handleRemoveItem = (id) => {
    const itemToRemove = selectedItems.find(item => item.id === id);
    if (itemToRemove) {
      const key = `${itemToRemove.dbType}-${itemToRemove.type}-${itemToRemove.region}`;
      setSelections(prev => {
        const newSelections = { ...prev };
        delete newSelections[key];
        return newSelections;
      });
    }
    setSelectedItems(prev => prev.filter(item => item.id !== id));
  };

  const handleApplicantInfoChange = (e) => {
    setDisplayErrors({});
    const { name, value } = e.target;

    if (name === 'phone') {
        const digits = value.replace(/[^\d]/g, '').substring(3);
        let formattedPhone = '010-';
        if (digits.length > 0) formattedPhone += digits.substring(0, 4);
        if (digits.length > 4) formattedPhone += '-' + digits.substring(4, 8);
        setFormData(prev => ({ ...prev, phone: formattedPhone }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAffiliationChange = (value) => {
    setDisplayErrors({});
    setFormData(prev => ({ ...prev, affiliation: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const newErrors = {};
    if (!formData.name) newErrors.name = "이름을 확인해주세요";
    if (nameEnglishWarning) newErrors.name = nameEnglishWarning;
    if (!formData.affiliation) newErrors.affiliation = "소속을 확인해주세요";
    if (!/^010-\d{4}-\d{4}$/.test(formData.phone)) newErrors.phone = "전화번호를 확인해주세요";
    if (!formData.email) newErrors.email = "이메일을 입력해주세요";
    if (emailKoreanWarning) newErrors.email = emailKoreanWarning;
    if (selectedItems.length === 0) newErrors.items = "하나 이상의 DB를 신청내역에 추가해주세요.";

    if (Object.keys(newErrors).length > 0) {
        setDisplayErrors(newErrors);
        return;
    }
    
    setDisplayErrors({});
    setIsSubmitting(true);

    const serviceID = 'service_gf7tr94';
    const templateID = 'template_5wlvuso';
    const publicKey = 'si6sUamB5hB5f3V6d';
    const itemsSummary = selectedItems.map(item => `${item.name} - 수량: ${item.quantity}, 금액: ${item.total.toLocaleString()}원`).join('<br>');
    const templateParams = { ...formData, items_summary: itemsSummary, total: total.toLocaleString() };
    
    emailjs.init(publicKey);
    emailjs.send(serviceID, templateID, templateParams)
      .then(() => {
        navigate('/order-confirmation');
      }, (err) => {
        setDisplayErrors({ submit: `이메일 발송에 실패했습니다: ${err.text}` });
        setIsSubmitting(false);
      });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-slate-800 py-20">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-100 mb-4">
            DB신청
          </h1>
          <p className="text-lg md:text-xl text-gray-300 font-medium">
            간편하고 빠른 데이터베이스 신청 서비스
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4">
        <div className="max-w-3xl mx-auto pt-8">
          <Card className="border border-gray-300">
            <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* DB 선택 섹션 */}
              <div className="space-y-6">
                
                {Object.entries(companyTypes).map(([dbType, types]) => (
                  <Card key={dbType} className={`p-4 ${dbType === 'A' ? 'border-2 border-red-300 bg-red-25' : 'border-2 border-blue-300 bg-blue-25'}`}>
                    <h4 className={`font-medium mb-3 text-lg ${dbType === 'A' ? 'text-red-500' : 'text-blue-500'}`}>{dbType}업체</h4>
                    <div className="space-y-4">
                      {types.map(type => (
                        <div key={type.name} className="border rounded-lg p-3">
                          <div className="font-bold mb-2 text-lg">
                            {type.name} ({type.price.toLocaleString()}원)
                          </div>
                          <div className="grid grid-cols-3 gap-1">
                            {regions.map(region => {
                              const key = `${dbType}-${type.name}-${region}`;
                              return (
                                <div key={region} className="flex items-center space-x-1">
                                  <Checkbox
                                    id={key}
                                    checked={selections[key] || false}
                                    onCheckedChange={(checked) => 
                                      handleCheckboxChange(dbType, type.name, region, checked)
                                    }
                                  />
                                  <Label htmlFor={key} className="text-base">{region}</Label>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>

              {/* 선택된 항목들 */}
              {selectedItems.length > 0 && (
                <div className="p-4 border rounded-md space-y-2">
                    <h3 className="font-semibold text-lg">신청 내역</h3>
                    {selectedItems.map((item, index) => (
                        <div key={item.id} className="p-3 bg-gray-50 rounded-md space-y-2">
                            {/* 첫 번째 줄: 제품명 */}
                            <div className="font-medium text-base">
                                {index + 1}. {item.name}
                            </div>
                            {/* 두 번째 줄: 수량 조절, 가격, 삭제 버튼 */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Button type="button" variant="outline" size="icon" className="h-8 w-8 rounded-r-none" onClick={() => handleQuantityChangeInList(item.id, item.quantity - 1)}>-</Button>
                                    <Input 
                                        type="number" 
                                        value={item.quantity} 
                                        onChange={(e) => handleQuantityChangeInList(item.id, e.target.value)}
                                        className="w-16 h-8 text-center rounded-none border-l-0 border-r-0 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                                        min="0"
                                    />
                                    <Button type="button" variant="outline" size="icon" className="h-8 w-8 rounded-l-none" onClick={() => handleQuantityChangeInList(item.id, item.quantity + 1)}>+</Button>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-blue-600 text-xl">{item.total.toLocaleString()}원</span>
                                    <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveItem(item.id)}>
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
              )}

              {/* 총 금액 표시 */}
              {selectedItems.length > 0 && (
                <div className="text-2xl font-bold text-right bg-blue-50 p-4 rounded-md border-2 border-blue-200">
                  총 금액: {total.toLocaleString()}원
                </div>
              )}

              {/* 신청자 정보 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="name">이름</Label>
                  <Input id="name" name="name" type="text" value={formData.name} onChange={handleApplicantInfoChange} placeholder="한글로 입력하세요" />
                  {nameEnglishWarning && <p className="text-base text-yellow-600 mt-1">{nameEnglishWarning}</p>}
                  {displayErrors.name && <p className="text-base text-red-500">{displayErrors.name}</p>}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="affiliation">소속</Label>
                  <Select onValueChange={handleAffiliationChange}><SelectTrigger><SelectValue placeholder="소속을 선택하세요" /></SelectTrigger><SelectContent>{affiliations.map(aff => <SelectItem key={aff} value={aff}>{aff}</SelectItem>)}</SelectContent></Select>
                  {displayErrors.affiliation && <p className="text-base text-red-500">{displayErrors.affiliation}</p>}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="phone">전화번호</Label>
                  <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleApplicantInfoChange} placeholder="010-0000-0000" />
                  {displayErrors.phone && <p className="text-base text-red-500">{displayErrors.phone}</p>}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="email">이메일</Label>
                  <Input id="email" name="email" type="email" value={formData.email} onChange={handleApplicantInfoChange} placeholder="이메일을 입력하세요" />
                  {emailKoreanWarning && <p className="text-base text-yellow-600 mt-1">{emailKoreanWarning}</p>}
                  {displayErrors.email && <p className="text-base text-red-500 mt-1">{displayErrors.email}</p>}
                </div>
              </div>

              {displayErrors.items && <p className="text-base text-red-500 text-center">{displayErrors.items}</p>}

              <Button type="submit" className="w-full text-white btn-gradient-flow transition-transform duration-300 hover:scale-105" disabled={isSubmitting || selectedItems.length === 0 || !!emailKoreanWarning || !!nameEnglishWarning}>
                {isSubmitting ? '신청하는 중...' : '신청하기'}
              </Button>
              {displayErrors.submit && <p className="text-base text-red-500 text-center">{displayErrors.submit}</p>}
            </form>
            <div className="mt-8 flex justify-center">
                <img 
                    src="/logo_black.png?v=1" 
                    alt="Logo" 
                    className="h-7 max-w-full" 
                    loading="eager"
                    onError={(e) => {
                        console.error('Logo loading failed');
                        e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjMwIiB2aWV3Qm94PSIwIDAgMTAwIDMwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjx0ZXh0IHg9IjUwIiB5PSIxNSIgZmlsbD0iYmxhY2siIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9IjAuM2VtIj5Mb2dvPC90ZXh0Pjwvc3ZnPg==';
                    }}
                />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </div>
  );
};

export default CheckboxGridPage;