import React, { useState, useEffect } from 'react';
import emailjs from '@emailjs/browser';
import CheckboxGridPage from './CheckboxGridPage'; // 1단계 컴포넌트
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { motion, AnimatePresence } from 'framer-motion';

const affiliations = ["GOAT", "감동", "다올", "다원", "달", "라온", "미르", "유럽", "직할", "캐슬", "해성", "혜윰"];

const AnimatedFormField = ({ children }) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 20, height: 0 }}
    animate={{ opacity: 1, y: 0, height: 'auto' }}
    exit={{ opacity: 0, y: -20, height: 0 }}
    transition={{ duration: 0.3, ease: "easeInOut" }}
  >
    {children}
  </motion.div>
);

// 2단계: 신청자 정보 입력 컴포넌트
const ApplicantForm = ({ onBack, onSubmit, isSubmitting, selectedItems, onQuantityChange }) => {
  const [applicant, setApplicant] = useState({ name: "", affiliation: "", phone: "010-", email: "" });
  const [errors, setErrors] = useState({});
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const totalAmount = selectedItems.reduce((sum, item) => sum + item.total, 0);

  const validateField = (name, value) => {
    let error = '';
    if (name === 'name') {
      if (/[a-zA-Z]/.test(value)) error = '이름에는 영문을 사용할 수 없습니다.';
      else if (!value) error = '이름을 입력해주세요.';
    } else if (name === 'affiliation') {
      if (!value) error = '소속을 선택해주세요.';
    } else if (name === 'phone') {
      if (!/^010-\d{4}-\d{4}$/.test(value)) error = '전화번호 8자리를 모두 입력해주세요.';
    } else if (name === 'email') {
      if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value)) error = '유효한 이메일 주소를 입력해주세요.';
    }
    return error;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let finalValue = value;

    if (name === 'phone') {
      if (!value.startsWith('010-')) {
        setApplicant(prev => ({ ...prev }));
        return;
      }
      let userInput = value.substring(4).replace(/[^\d]/g, '');
      userInput = userInput.substring(0, 8);
      let formattedPhone = "010-";
      if (userInput.length > 0) formattedPhone += userInput.substring(0, 4);
      if (userInput.length > 4) formattedPhone += "-" + userInput.substring(4);
      finalValue = formattedPhone;
    } else if (name === 'email') {
      finalValue = value.replace(/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/g, '');
    } else if (name === 'name') {
      finalValue = value.replace(/[a-zA-Z]/g, '');
    }
    
    setApplicant((prev) => ({ ...prev, [name]: finalValue }));
    
    const error = validateField(name, finalValue);
    setErrors(prev => ({...prev, [name]: error }));
  };

  const handleAffiliationChange = (value) => {
    setApplicant((prev) => ({ ...prev, affiliation: value }));
    const error = validateField('affiliation', value);
    setErrors(prev => ({...prev, affiliation: error }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setIsConfirmOpen(true);
  };

  const handleConfirmSubmit = () => {
    setIsConfirmOpen(false);
    onSubmit(applicant);
  }

  const isNameValid = applicant.name && !validateField('name', applicant.name);
  const isAffiliationValid = applicant.affiliation && !validateField('affiliation', applicant.affiliation);
  const isPhoneValid = applicant.phone && !validateField('phone', applicant.phone);
  const isEmailValid = applicant.email && !validateField('email', applicant.email);

  return (
    <>
      <div className="max-w-2xl mx-auto">
        <div className="bg-white p-6 rounded-lg shadow-md">
          {/* ... 주문 내역 ... */}
          <div className="w-full mb-6">
            <h2 className="text-xl font-semibold mb-4">주문 내역</h2>
            <div className="p-4 border rounded-md space-y-2">
              {selectedItems.map((item, index) => (
                <div key={item.id} className="p-3 bg-gray-50 rounded-md space-y-2">
                  <div className="font-medium text-sm whitespace-nowrap overflow-hidden text-ellipsis">{index + 1}. {item.name}</div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button type="button" variant="outline" size="icon" className="h-8 w-8 rounded-r-none" onClick={() => onQuantityChange(item.id, item.quantity - 1)}>-</Button>
                      <Input type="number" value={item.quantity} onChange={(e) => onQuantityChange(item.id, e.target.value)} className="w-16 h-8 text-center rounded-none border-l-0 border-r-0 [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" min="0" />
                      <Button type="button" variant="outline" size="icon" className="h-8 w-8 rounded-l-none" onClick={() => onQuantityChange(item.id, item.quantity + 1)}>+</Button>
                    </div>
                    <div className="font-bold text-blue-600 text-lg">{item.total.toLocaleString()}원</div>
                  </div>
                </div>
              ))}
              <div className="text-xl font-bold text-right pt-2 border-t">총 합계: {totalAmount.toLocaleString()}원</div>
            </div>
          </div>

          <form onSubmit={handleFormSubmit} onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}>
            <h2 className="text-xl font-semibold mb-4">신청자 정보</h2>
            <div className="space-y-4">
              <AnimatedFormField>
                <div>
                  <Label htmlFor="name">이름</Label>
                  <Input id="name" name="name" placeholder="한글로 입력하세요" value={applicant.name} onChange={handleInputChange} />
                  {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
                </div>
              </AnimatedFormField>

              <AnimatePresence>
                {isNameValid && (
                  <AnimatedFormField>
                    <div>
                      <Label htmlFor="affiliation">소속</Label>
                      <Select onValueChange={handleAffiliationChange} value={applicant.affiliation}>
                        <SelectTrigger id="affiliation"><SelectValue placeholder="소속을 선택하세요" /></SelectTrigger>
                        <SelectContent side="top">{affiliations.map(aff => <SelectItem key={aff} value={aff}>{aff}</SelectItem>)}</SelectContent>
                      </Select>
                      {errors.affiliation && <p className="text-sm text-red-500 mt-1">{errors.affiliation}</p>}
                    </div>
                  </AnimatedFormField>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {isNameValid && isAffiliationValid && (
                  <AnimatedFormField>
                    <div>
                      <Label htmlFor="phone">연락처</Label>
                      <Input id="phone" name="phone" type="tel" inputMode="numeric" placeholder="010-0000-0000" value={applicant.phone} onChange={handleInputChange} />
                      {errors.phone && <p className="text-sm text-red-500 mt-1">{errors.phone}</p>}
                    </div>
                  </AnimatedFormField>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {isNameValid && isAffiliationValid && isPhoneValid && (
                  <AnimatedFormField>
                    <div>
                      <Label htmlFor="email">이메일</Label>
                      <Input id="email" name="email" type="email" placeholder="이메일 주소를 입력하세요" value={applicant.email} onChange={handleInputChange} />
                      {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
                    </div>
                  </AnimatedFormField>
                )}
              </AnimatePresence>
            </div>

            <div className="mt-8 flex justify-between">
              <button type="button" onClick={onBack} className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600">이전</button>
              <AnimatePresence>
                {isNameValid && isAffiliationValid && isPhoneValid && isEmailValid && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <button type="submit" disabled={isSubmitting || totalAmount === 0} className="bg-blue-500 text-white px-6 py-2 rounded-lg shadow-lg hover:bg-blue-600 disabled:bg-gray-400">
                      {isSubmitting ? "신청 접수 중..." : "신청하기"}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </form>
        </div>
      </div>

      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>신청 내역을 확인해주세요</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="p-4 border rounded-md space-y-2 max-h-60 overflow-y-auto mt-4">
                {selectedItems.map((item, index) => (
                  <div key={item.id} className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
                    <span>{index + 1}. {item.name} (수량: {item.quantity})</span>
                    <span>{item.total.toLocaleString()}원</span>
                  </div>
                ))}
                <div className="text-lg font-bold text-right pt-2 border-t">총 합계: {totalAmount.toLocaleString()}원</div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSubmit}>최종 신청</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

// 3단계: 감사 페이지 컴포넌트
const OrderConfirmationPage = ({ onRestart }) => (
  <div className="max-w-2xl mx-auto text-center">
    <div className="bg-white p-8 rounded-lg shadow-md">
      <h1 className="text-3xl font-bold text-green-500 mb-4">신청 완료!</h1>
      <p className="text-lg mb-6">신청이 완료되었습니다. 확인 후 개별 연락드리겠습니다.</p>
      <button onClick={onRestart} className="bg-blue-500 text-white px-8 py-3 rounded-lg shadow-lg hover:bg-blue-600">
        새로 신청하기
      </button>
    </div>
  </div>
);

// ... (rest of the file is the same)

const Index = () => {
  const [step, setStep] = useState(1);
  const [selectedItems, setSelectedItems] = useState([]);
  const [selections, setSelections] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNext = () => {
    setStep(2);
  };

  const handleBack = () => {
    setStep((prevStep) => Math.max(1, prevStep - 1));
  };

  const handleQuantityChange = (id, newQuantity) => {
    const quantity = Math.max(0, parseInt(newQuantity, 10) || 0);
    setSelectedItems(prevItems => 
        prevItems.map(item => 
            item.id === id ? { ...item, quantity, total: quantity * item.price } : item
        ).filter(item => {
          if (item.id === id && quantity === 0) {
            setSelections(prev => {
              const newSelections = { ...prev };
              delete newSelections[`${item.dbType}-${item.type}-${item.region}`];
              return newSelections;
            });
            return false;
          }
          return true;
        })
    );
  };

  const handleCheckboxChange = (dbType, typeName, region, checked, typeInfo) => {
    const key = `${dbType}-${typeName}-${region}`;
    if (checked) {
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

  useEffect(() => {
    const handleBrowserBack = (event) => {
      event.preventDefault();
      handleBack();
    };

    if (step === 2) {
      window.history.pushState({ step: 2 }, '', window.location.href);
      window.addEventListener('popstate', handleBrowserBack);
    }

    return () => {
      window.removeEventListener('popstate', handleBrowserBack);
    };
  }, [step]);

  const handleSubmit = async (applicant) => {
    if (selectedItems.length === 0) {
      alert("주문 내역이 없습니다. 이전 단계로 돌아가 항목을 선택해주세요.");
      return;
    }
    setIsSubmitting(true);

    const templateParams = {
      ...applicant,
      full_address: '', // 템플릿 변수에 맞춤
      items_summary: selectedItems.map(item => `${item.name} (수량: ${item.quantity}, 금액: ${item.total.toLocaleString()}원)`).join('<br>'), // 템플릿 변수에 맞춤
      total: selectedItems.reduce((sum, item) => sum + item.total, 0).toLocaleString(), // 템플릿 변수에 맞춤
    };

    const serviceID = 'service_gf7tr94';
    const templateID = 'template_5wlvuso';
    const publicKey = 'si6sUamB5hB5f3V6d';

    try {
      await emailjs.send(serviceID, templateID, templateParams, publicKey);
      setStep(3);
    } catch (error) {
      console.error('Failed to send email:', error);
      alert(`이메일 발송에 실패했습니다: ${error.text}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestart = () => {
    setSelectedItems([]);
    setSelections({});
    setStep(1);
  };

  return (
    <div className="px-4 py-8">
      {step === 1 && (
        <CheckboxGridPage 
          onNext={handleNext} 
          selectedItems={selectedItems}
          selections={selections}
          onCheckboxChange={handleCheckboxChange}
          onQuantityChange={handleQuantityChange}
          onRemoveItem={handleRemoveItem}
        />
      )}
      {step === 2 && <ApplicantForm onBack={handleBack} onSubmit={handleSubmit} isSubmitting={isSubmitting} selectedItems={selectedItems} onQuantityChange={handleQuantityChange} />}
      {step === 3 && <OrderConfirmationPage onRestart={handleRestart} />}
    </div>
  );
};

export default Index;