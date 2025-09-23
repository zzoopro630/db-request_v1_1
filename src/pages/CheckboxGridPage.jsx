import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const regions = ["서울/인천/경기", "대전/충청", "광주/전남", "전북", "대구/경북", "부산/울산/경남", "강원", "제주"];
const companyTypes = {
  A: [{ name: "보장분석", price: 80000 }],
  B: [
    { name: "3주납품", price: 75000 },
    { name: "실버", price: 50000 },
    { name: "중장년", price: 85000 },
    { name: "여성100%", price: 80000 },
    { name: "보험료20만원이상", price: 85000 },
    { name: "방문확정", price: 90000 },
    { name: "화재보험", price: 75000 },
  ]
};

const SummaryComponent = ({ 
  isScrollable,
  selectedItems,
  total,
  onQuantityChange,
  onRemoveItem,
  onNextClick
}) => {
  const scrollClasses = isScrollable ? "max-h-48 overflow-y-auto" : "";

  return (
    <div className="space-y-4">
      <div className={`p-4 border rounded-md space-y-2 ${scrollClasses}`}>
        <h3 className="font-semibold text-md">신청 내역</h3>
        {selectedItems.map((item, index) => (
          <div key={item.id} className="p-3 bg-gray-50 rounded-md space-y-2">
            <div className="font-medium text-sm whitespace-nowrap overflow-hidden text-ellipsis">{index + 1}. {item.name}</div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="icon" className="h-8 w-8 rounded-r-none" onClick={() => onQuantityChange(item.id, item.quantity - 1)}>-</Button>
                <Input type="number" value={item.quantity} onChange={(e) => onQuantityChange(item.id, e.target.value)} className="w-16 h-8 text-center rounded-none border-l-0 border-r-0 [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" min="0" />
                <Button type="button" variant="outline" size="icon" className="h-8 w-8 rounded-l-none" onClick={() => onQuantityChange(item.id, item.quantity + 1)}>+</Button>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-blue-600 text-base">{item.total.toLocaleString()}원</span>
                <Button type="button" variant="ghost" size="icon" onClick={() => onRemoveItem(item.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="text-xl font-bold text-right bg-blue-50 p-4 rounded-md border-2 border-blue-200">
        총 금액: {total.toLocaleString()}원
      </div>
      <Button onClick={onNextClick} className="w-full" disabled={selectedItems.length === 0}>다음</Button>
    </div>
  );
};

const CheckboxList = React.memo(({ selections, onCheckboxChange }) => {
  return (
    <div className="space-y-6">
      {Object.entries(companyTypes).map(([dbType, types]) => (
        <Card key={dbType} className={`p-4 ${dbType === 'A' ? 'border-2 border-red-300 bg-red-25' : 'border-2 border-blue-300 bg-blue-25'}`}>
          <h4 className={`font-medium mb-3 text-lg ${dbType === 'A' ? 'text-red-500' : 'text-blue-500'}`}>{dbType}업체</h4>
          <div className="space-y-4">
            {types.map(type => (
              <div key={type.name} className="border rounded-lg p-3">
                <div className="font-bold mb-2 text-lg">{type.name} ({type.price.toLocaleString()}원)</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {regions.map(region => {
                    const key = `${dbType}-${type.name}-${region}`;
                    return (
                      <div key={region} className="flex items-center space-x-1">
                        <Checkbox id={key} checked={selections[key] || false} onCheckedChange={(checked) => onCheckboxChange(dbType, type.name, region, checked, type)} />
                        <Label htmlFor={key} className="text-sm font-medium">{region}</Label>
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
  );
});

const CheckboxGridPage = ({ 
  onNext,
  selectedItems,
  selections,
  onCheckboxChange,
  onQuantityChange,
  onRemoveItem 
}) => {
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const newTotal = selectedItems.reduce((sum, item) => sum + item.total, 0);
    setTotal(newTotal);
  }, [selectedItems]);

  const handleNextClick = () => {
    if (selectedItems.length > 0) {
      onNext();
    }
  };

  const summaryProps = {
    selectedItems,
    total,
    onQuantityChange,
    onRemoveItem,
    onNextClick: handleNextClick
  };

  return (
    <>
      <div className="bg-slate-800 py-12 mb-8">
        <div className="max-w-7xl mx-auto text-center px-4">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-100 mb-4">DB 신청</h1>
          <p className="text-lg text-gray-300 font-medium">간편하고 빠른 데이터베이스 신청 서비스</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto lg:flex lg:gap-8 px-4 lg:justify-center">
        <motion.div layout className={selectedItems.length > 0 ? "lg:w-2/3" : "lg:w-full lg:max-w-3xl"}>
          <Card className="border-gray-300">
            <CardContent className="pt-6 space-y-6 pb-96 lg:pb-6">
              <CheckboxList selections={selections} onCheckboxChange={onCheckboxChange} />
            </CardContent>
          </Card>
        </motion.div>

        <AnimatePresence>
          {selectedItems.length > 0 && (
            <>
              {/* Mobile: Bottom Fixed */}
              <motion.div
                className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] p-4"
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "tween", ease: "easeInOut" }}
              >
                <SummaryComponent {...summaryProps} isScrollable={true} />
              </motion.div>

              {/* Desktop: Right Sticky */}
              <motion.div
                className="hidden lg:block lg:w-1/3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ ease: "easeInOut", duration: 0.4 }}
              >
                <div className="sticky top-8 space-y-4">
                  <Card className="border-gray-300 shadow-lg">
                    <CardContent className="p-6">
                      <SummaryComponent {...summaryProps} isScrollable={false} />
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default CheckboxGridPage;
