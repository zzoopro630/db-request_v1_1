import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Calendar, Download, Search, Users, DollarSign, Clock, CheckCircle, Trash2, Eye, Package, TrendingUp } from 'lucide-react';
import { Checkbox } from "@/components/ui/checkbox";
import { createClient } from '@supabase/supabase-js';

// Supabase client configuration (using anon key for read-only access)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const resolveApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL?.trim();
  if (envUrl) return envUrl.replace(/\/$/, '');
  if (import.meta.env.DEV) return 'http://localhost:3001';
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin.replace(/\/$/, '');
  }
  return '';
};

const API_BASE_URL = resolveApiBaseUrl();

const AdminDashboard = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [monthlyAggregation, setMonthlyAggregation] = useState([]);
  const [aggregationLoading, setAggregationLoading] = useState(true);

  // Fetch submissions from Supabase
  useEffect(() => {
    fetchSubmissions();
    fetchMonthlyAggregation();
  }, []);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubmissions(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch monthly aggregation for applications (including legacy submissions)
  const fetchMonthlyAggregation = async () => {
    try {
      setAggregationLoading(true);

      const response = await fetch(`${API_BASE_URL}/api/submissions/aggregation`);

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error || '집계 데이터를 불러오지 못했습니다.');
      }

      const data = await response.json();
      setMonthlyAggregation(data.aggregated || []);
    } catch (err) {
      console.error('Error fetching monthly aggregation:', err);
      setMonthlyAggregation([]);
    } finally {
      setAggregationLoading(false);
    }
  };

  // Update submission status
  const updateStatus = async (id, newStatus) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/submissions/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error || '상태를 변경할 수 없습니다.');
      }

      const { submission } = await response.json();

      // Update local state with response data for consistency
      setSubmissions(prev =>
        prev.map(sub =>
          sub.id === id ? { ...sub, ...submission } : sub
        )
      );

      // Refresh aggregation when status changes
      fetchMonthlyAggregation();
    } catch (err) {
      alert('상태 업데이트 실패: ' + err.message);
    }
  };

  // Delete submission
  const deleteSubmission = async (id, submissionName) => {
    if (!confirm(`"${submissionName}" 신청을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/submissions/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error || '서버 요청에 실패했습니다.');
      }

      setSubmissions(prev => prev.filter(sub => sub.id !== id));
      fetchMonthlyAggregation();
      alert('신청이 삭제되었습니다.');
    } catch (err) {
      if (err instanceof TypeError) {
        alert('삭제 실패: 백엔드 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.');
      } else {
        alert('삭제 실패: ' + err.message);
      }
    }
  };

  // Fetch order items for a specific submission
  const fetchOrderItems = async (submissionId) => {
    try {
      const { data, error } = await supabase
        .from('order_items')
        .select('*')
        .eq('submission_id', submissionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setOrderItems(data || []);
    } catch (err) {
      console.error('Error fetching order items:', err);
      setOrderItems([]);
    }
  };

  // View submission details
  const viewSubmissionDetails = async (submission) => {
    setSelectedSubmission(submission);
    await fetchOrderItems(submission.id);
  };

  // Checkbox selection functions
  const handleSelectAll = (checked) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedIds(new Set(filteredSubmissions.map(sub => sub.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id, checked) => {
    const newSelectedIds = new Set(selectedIds);
    if (checked) {
      newSelectedIds.add(id);
    } else {
      newSelectedIds.delete(id);
    }
    setSelectedIds(newSelectedIds);
    setSelectAll(newSelectedIds.size === filteredSubmissions.length);
  };

  // Bulk delete function
  const bulkDeleteSubmissions = async () => {
    if (selectedIds.size === 0) {
      alert('삭제할 항목을 선택해주세요.');
      return;
    }

    if (!confirm(`선택한 ${selectedIds.size}건의 신청을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/submissions/bulk-delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error || '서버 요청에 실패했습니다.');
      }

      setSubmissions(prev => prev.filter(sub => !selectedIds.has(sub.id)));
      setSelectedIds(new Set());
      setSelectAll(false);
      fetchMonthlyAggregation();
      alert(`${selectedIds.size}건의 신청이 삭제되었습니다.`);
    } catch (err) {
      if (err instanceof TypeError) {
        alert('일괄 삭제 실패: 백엔드 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.');
      } else {
        alert('일괄 삭제 실패: ' + err.message);
      }
    }
  };

  // Filter submissions
  const filteredSubmissions = submissions.filter(submission => {
    const matchesSearch =
      submission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.affiliation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || submission.status === statusFilter;

    let matchesDate = true;
    if (dateFilter !== 'all') {
      const submissionDate = new Date(submission.created_at);
      const today = new Date();
      const daysDiff = Math.floor((today - submissionDate) / (1000 * 60 * 60 * 24));

      switch (dateFilter) {
        case 'today':
          matchesDate = daysDiff === 0;
          break;
        case 'week':
          matchesDate = daysDiff <= 7;
          break;
        case 'month':
          matchesDate = daysDiff <= 30;
          break;
        default:
          matchesDate = true;
      }
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['신청일시', '이름', '소속', '연락처', '이메일', '총금액', '상태', '신청내역'];
    const csvContent = [
      headers.join(','),
      ...filteredSubmissions.map(submission => [
        new Date(submission.created_at).toLocaleString('ko-KR'),
        submission.name,
        submission.affiliation,
        submission.phone,
        submission.email,
        submission.total_amount.toLocaleString(),
        submission.status,
        `"${submission.items_summary.replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `db_submissions_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Statistics
  const stats = {
    total: submissions.length,
    pending: submissions.filter(s => s.status === 'pending').length,
    confirmed: submissions.filter(s => s.status === 'confirmed').length,
    completed: submissions.filter(s => s.status === 'completed').length,
    totalAmount: submissions.reduce((sum, s) => sum + (s.total_amount || 0), 0),
  };

  if (loading) return <div className="flex justify-center items-center min-h-screen">로딩 중...</div>;
  if (error) return <div className="flex justify-center items-center min-h-screen text-red-500">오류: {error}</div>;

  return (
    <div className="max-w-full mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">DB 신청 관리 대시보드</h1>
        <Button onClick={exportToCSV} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          CSV 다운로드
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전체 신청</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">대기</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">확인</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.confirmed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">완료</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 금액</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAmount.toLocaleString()}원</div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Application Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-xl">이번 달 신청 집계 ({new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })})</CardTitle>
            <Badge variant="secondary" className="ml-auto">확인된 신청만</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {aggregationLoading ? (
            <div className="flex justify-center py-8">
              <div className="text-gray-500">집계 데이터 로딩 중...</div>
            </div>
          ) : monthlyAggregation.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>이번 달 신청 내역이 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {monthlyAggregation.map((product, index) => (
                <div key={index} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold text-lg text-gray-900">{product.productName}</h3>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">총 수량</div>
                      <div className="text-xl font-bold text-blue-600">{product.totalQuantity}개</div>
                      <div className="text-sm text-gray-600">{product.totalAmount.toLocaleString()}원</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {product.regions.map((region, regionIndex) => (
                      <div key={regionIndex} className="bg-white p-3 rounded border">
                        <div className="text-sm font-medium text-gray-700">{region.regionName}</div>
                        <div className="text-lg font-bold text-gray-900">{region.quantity}개</div>
                        <div className="text-xs text-gray-500">{region.amount.toLocaleString()}원</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Summary Total */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    <span className="font-semibold text-blue-900">이번 달 총 신청량</span>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-900">
                      {monthlyAggregation.reduce((sum, product) => sum + product.totalQuantity, 0)}개
                    </div>
                    <div className="text-blue-700">
                      {monthlyAggregation.reduce((sum, product) => sum + product.totalAmount, 0).toLocaleString()}원
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4" />
          <Input
            placeholder="이름, 소속, 이메일로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 상태</SelectItem>
            <SelectItem value="pending">대기</SelectItem>
            <SelectItem value="confirmed">확인</SelectItem>
            <SelectItem value="completed">완료</SelectItem>
          </SelectContent>
        </Select>

        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 기간</SelectItem>
            <SelectItem value="today">오늘</SelectItem>
            <SelectItem value="week">1주일</SelectItem>
            <SelectItem value="month">1개월</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Submissions Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>신청 목록 ({filteredSubmissions.length}건)</CardTitle>
            {selectedIds.size > 0 && (
              <Button
                onClick={bulkDeleteSubmissions}
                variant="destructive"
                size="sm"
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                선택 삭제 ({selectedIds.size})
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px] table-fixed divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="w-12 px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <Checkbox
                      checked={selectAll}
                      onCheckedChange={handleSelectAll}
                    />
                  </th>
                  <th className="w-36 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">신청일시</th>
                  <th className="w-52 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">신청자</th>
                  <th className="w-32 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">연락처</th>
                  <th className="w-24 px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">총 금액</th>
                  <th className="w-32 px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                  <th className="w-80 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">신청내역</th>
                  <th className="w-20 px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">작업</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSubmissions.map((submission) => (
                  <tr key={submission.id} className="hover:bg-gray-50">
                    <td className="w-12 px-3 py-4 text-center">
                      <Checkbox
                        checked={selectedIds.has(submission.id)}
                        onCheckedChange={(checked) => handleSelectOne(submission.id, checked)}
                      />
                    </td>
                    <td className="w-36 px-4 py-4 text-sm text-gray-900">
                      <div className="truncate">{new Date(submission.created_at).toLocaleDateString('ko-KR')}</div>
                      <div className="text-xs text-gray-500 truncate">{new Date(submission.created_at).toLocaleTimeString('ko-KR')}</div>
                    </td>
                    <td className="w-52 px-4 py-4">
                      <div className="text-sm font-medium text-gray-900 truncate">{submission.name}</div>
                      <div className="text-sm text-gray-500 truncate">{submission.affiliation}</div>
                      <div className="text-xs text-gray-500 truncate">{submission.email}</div>
                    </td>
                    <td className="w-32 px-4 py-4 text-sm text-gray-900">
                      <div className="truncate">{submission.phone}</div>
                    </td>
                    <td className="w-24 px-4 py-4 text-sm font-medium text-gray-900 text-right">
                      <div className="truncate">{submission.total_amount.toLocaleString()}원</div>
                    </td>
                    <td className="w-32 px-4 py-4 text-center">
                      <Select
                        value={submission.status}
                        onValueChange={(value) => updateStatus(submission.id, value)}
                      >
                        <SelectTrigger className="w-full h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">대기</SelectItem>
                          <SelectItem value="confirmed">확인</SelectItem>
                          <SelectItem value="completed">완료</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="w-80 px-4 py-4 text-sm text-gray-900">
                      <div
                        className="truncate cursor-pointer hover:text-blue-600"
                        title={submission.items_summary.replace(/<br>/g, '\n')}
                        dangerouslySetInnerHTML={{ __html: submission.items_summary }}
                      />
                    </td>
                    <td className="w-20 px-4 py-4 text-center text-sm font-medium">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => viewSubmissionDetails(submission)}
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>신청 상세 정보</DialogTitle>
                              <DialogDescription>
                                {selectedSubmission?.name}님의 신청 내역
                              </DialogDescription>
                            </DialogHeader>
                            {selectedSubmission && (
                              <div className="space-y-6">
                                {/* Submission Info */}
                                <Card>
                                  <CardHeader>
                                    <CardTitle className="text-lg">신청자 정보</CardTitle>
                                  </CardHeader>
                                  <CardContent className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="text-sm font-medium text-gray-500">이름</label>
                                      <p>{selectedSubmission.name}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-gray-500">소속</label>
                                      <p>{selectedSubmission.affiliation}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-gray-500">연락처</label>
                                      <p>{selectedSubmission.phone}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-gray-500">이메일</label>
                                      <p>{selectedSubmission.email}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-gray-500">신청일시</label>
                                      <p>{new Date(selectedSubmission.created_at).toLocaleString('ko-KR')}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-gray-500">총 금액</label>
                                      <p className="font-bold text-lg">{selectedSubmission.total_amount.toLocaleString()}원</p>
                                    </div>
                                  </CardContent>
                                </Card>

                                {/* Order Items */}
                                <Card>
                                  <CardHeader>
                                    <CardTitle className="text-lg">주문 상품 목록</CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    {orderItems.length > 0 ? (
                                      <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                          <thead className="bg-gray-50">
                                            <tr>
                                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">업체</th>
                                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">상품명</th>
                                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">지역</th>
                                              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">수량</th>
                                              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">단가</th>
                                              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">총액</th>
                                            </tr>
                                          </thead>
                                          <tbody className="bg-white divide-y divide-gray-200">
                                            {orderItems.map((item, index) => (
                                              <tr key={index}>
                                                <td className="px-3 py-2 text-sm text-gray-900">{item.db_type}업체</td>
                                                <td className="px-3 py-2 text-sm text-gray-900">{item.product_name}</td>
                                                <td className="px-3 py-2 text-sm text-gray-900">{item.region}</td>
                                                <td className="px-3 py-2 text-sm text-gray-900 text-right">{item.quantity}</td>
                                                <td className="px-3 py-2 text-sm text-gray-900 text-right">{item.unit_price.toLocaleString()}원</td>
                                                <td className="px-3 py-2 text-sm font-medium text-gray-900 text-right">{item.total_price.toLocaleString()}원</td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    ) : (
                                      <p className="text-gray-500 text-center py-4">개별 상품 정보가 없습니다.</p>
                                    )}
                                  </CardContent>
                                </Card>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
