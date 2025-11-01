import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const regions = ["서울/인천/경기", "대전/충청", "광주/전남", "전북", "대구/경북", "부산/울산/경남", "강원", "제주"];
const companyTypes = {
  A: [{ name: "보장분석/일반", price: 80000, description: "보장분석 / 다양한 연령대 / 3주 이내 납품 완료 DB"  }],
  B: [
    { name: "3주납품", price: 75000, description: "보장분석 / 다양한 연령대 / 3주 이내 납품 완료 DB" },
    { name: "실버", price: 50000, description: "보장분석 / 보험 니즈 높은 고연령대 / 3주 이내 납품 완료 DB"  },
    { name: "중장년", price: 85000, description: "보장분석 / 보험 관심 높은 중장년 / 3주 이내 납품 완료 DB"  },
    { name: "여성100%", price: 80000, description: "보장분석 / 보험 니즈가 높은 여성 / 3주 이내 납품 완료 DB"  },
    { name: "보험료20만원이상", price: 85000, description: "보장분석 / 보험료 20만원 이상 납입 / 3주 이내 납품 완료 DB"  },
    { name: "방문확정", price: 90000, description: "보장분석 / 시간,장소 약속이 확정된 / 3주 이내 납품 완료 DB"  },
    { name: "화재보험", price: 75000, description: "보장분석 / 화재보험(1년/일반화재) 무료가입 멘트로 확보된 / 3주 이내 납품 완료 DB / 보험료 1만원 설계사 부담"  },
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
        <Card key={dbType} className="overflow-hidden rounded-lg border-2 border-blue-200">
          <div className="p-4 bg-brand-blue">
            <div className="flex flex-col gap-1">
              <div className="flex items-center">
                <h4 className="font-medium text-lg text-white">{dbType}업체</h4>
                {dbType === 'B' && <span className="ml-2 text-sm text-yellow-400 font-medium">(90년생은 납품하지 않습니다.)</span>}
              </div>
              {dbType === 'A' && (
                <div className="text-sm text-yellow-300 font-medium">
                  <div>- 모든 DB는 최소 5개부터 신청 가능합니다.</div>
                  <div>- DB는 건별 실시간으로 카카오톡 개별 전달</div>
                  <div>- 지사 단위 신청 가능, 추가 제한 없음</div>
                </div>
              )}
              {dbType === 'B' && (
                <div className="text-sm text-yellow-300 font-medium">
                  <div>- 모든 DB는 최소 5개부터 신청 가능합니다.</div>
                  <div>- 전산으로 배분, 관리</div>
                  <div>- 지사 단위 신청 가능, 추가 제한 없음</div>
                </div>
              )}
            </div>
          </div>
          <div className="p-4 bg-white">
            {dbType === 'A' && (
              <div className="text-sm text-gray-700 bg-gray-100 p-3 rounded-md mb-4">
                <p className="font-bold text-red-600">A/S 불가 항목</p>
                <p>- 단박 거절: 통화 연결 후 바로 상담을 거절하는 경우</p>
                <p>- 통화 후 부재: 고객과 1번이라도 통화가 된 이후의 장기 부재</p>
                <p>- 약속 후 노쇼(No-show): 방문 약속을 잡았으나 연락이 두절되거나 고객이 나타나지 않는 경우</p>
                <p>- 특정 목적 거절: '숨은 보험금/환급금 찾기'만 원한다며 보장 분석을 거절하는 경우</p><br />
                <p className="text-blue-600">*A업체는 조건에 따라 '장기부재' AS를 승인하고 있습니다.<br />
                  시간대를 다르게 하여 하루 2회, 총 2일간 연락이 되지 않을 경우 (통화 내역 첨부 필수)
                </p>
              </div>
            )}
            {dbType === 'B' && (
              <div className="text-sm text-gray-700 bg-gray-100 p-3 rounded-md mb-4">
                 <p className="font-bold text-red-600">A/S 불가 항목</p>
                 <p>- 장기 부재 및 단박 거절</p>
                 <p>- 상담(TA) 중 고객과 약속이 잡힌 경우</p>
              </div>
            )}
            <Accordion type="multiple" className="w-full">
              {types.map(type => (
                <AccordionItem value={type.name} key={type.name}>
                  <AccordionTrigger>
                    <div className="text-left">
                      <div className="font-bold text-lg">{type.name} ({type.price.toLocaleString()}원)</div>
                      {type.description && <p className="text-sm text-gray-600 mt-1">{type.description}</p>}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 pt-2">
                      {regions.map(region => {
                        const key = `${dbType}-${type.name}-${region}`;
                        return (
                          <div key={region} className="flex items-center space-x-1 p-2 rounded-md hover:bg-gray-100">
                            <Checkbox id={key} checked={selections[key] || false} onCheckedChange={(checked) => onCheckboxChange(dbType, type.name, region, checked, type)} />
                            <Label htmlFor={key} className="text-sm font-medium">{region}</Label>
                          </div>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </Card>
      ))}
    </div>
  );
});

const ProductList = ({ 
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
          <p className="text-lg text-gray-300 font-medium">간편하고 빠른 DB 신청 서비스</p>
          <p class="text-sm text-[#FFD700] mt-2">(퍼스트채널 전용)</p>
        </div>
      </div>

      <p className="text-sm text-center text-gray-600 mb-8">» 상품을 클릭하시면 지역을 선택하실 수 있습니다.</p>

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

export default ProductList;
