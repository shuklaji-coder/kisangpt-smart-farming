import axios from 'axios';

const backend = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

export interface LoanApplicationPayload {
  // Keep broad to allow backend handling
  [key: string]: any;
}

class LoanService {
  async fetchBanks(): Promise<{ name: string; rate: string; product: string }[]> {
    try {
      const res = await axios.get(`${backend}/api/loan/banks`, { timeout: 8000 });
      if (Array.isArray(res.data)) return res.data;
    } catch {}
    // Fallback demo banks
    return [
      { name: 'SBI', rate: '7.0% - 9.5%', product: 'KCC / Agri Term' },
      { name: 'PNB', rate: '7.5% - 10.0%', product: 'KCC / Crop Loan' },
      { name: 'HDFC Bank', rate: '8.5% - 12.0%', product: 'Agri Equipment' },
      { name: 'ICICI Bank', rate: '8.0% - 11.5%', product: 'KCC / Input Loan' },
      { name: 'NABARD Partner', rate: 'As per scheme', product: 'Refinance Linked' },
    ];
  }

  async applyLoan(payload: LoanApplicationPayload): Promise<{ applicationId: string }> {
    try {
      const res = await axios.post(`${backend}/api/loan/apply`, payload, { timeout: 10000 });
      if (res.status === 200 && res.data?.applicationId) return { applicationId: res.data.applicationId };
    } catch {}
    // Fallback mock response
    return { applicationId: 'DEMO-' + Math.floor(Math.random() * 1_000_000).toString().padStart(6, '0') };
  }

  async uploadDocument(file: File, field: string): Promise<{ url: string }> {
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('field', field);
      const res = await axios.post(`${backend}/api/loan/upload`, form, { timeout: 15000 });
      if (res.status === 200 && res.data?.url) return { url: res.data.url };
    } catch {}
    return { url: URL.createObjectURL(file) }; // demo local preview url
  }
}

const loanService = new LoanService();
export default loanService;
