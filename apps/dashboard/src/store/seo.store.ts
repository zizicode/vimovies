import { create } from 'zustand';
import { seoService, type SeoAuditLogItem, type RedirectItem, type SitemapIndexItem } from '../services/api.service';
import { useAuthStore } from './index';

interface SeoState {
  // Audit Logs
  auditLogs: SeoAuditLogItem[];
  auditLogsLoading: boolean;
  auditLogsError: string | null;
  
  // Redirects
  redirects: RedirectItem[];
  redirectsLoading: boolean;
  redirectsError: string | null;
  
  // Sitemaps
  sitemaps: SitemapIndexItem[];
  sitemapsLoading: boolean;
  sitemapsError: string | null;
  
  // Actions
  fetchAuditLogs: (params?: { entity_type?: string; locale?: string }) => Promise<void>;
  runAudit: (entityType: string, entityId: string, locale: string) => Promise<void>;
  fetchRedirects: () => Promise<void>;
  createRedirect: (redirect: Omit<RedirectItem, 'id' | 'created_at'>) => Promise<void>;
  updateRedirect: (id: number, redirect: Partial<RedirectItem>) => Promise<void>;
  deleteRedirect: (id: number) => Promise<void>;
  fetchSitemaps: () => Promise<void>;
  generateSitemap: (section: string) => Promise<void>;
  submitSitemap: (section: string) => Promise<void>;
}

export const useSeoStore = create<SeoState>((set) => ({
  // Initial state
  auditLogs: [],
  auditLogsLoading: false,
  auditLogsError: null,
  
  redirects: [],
  redirectsLoading: false,
  redirectsError: null,
  
  sitemaps: [],
  sitemapsLoading: false,
  sitemapsError: null,
  
  // Audit Logs actions
  fetchAuditLogs: async (params) => {
    const token = useAuthStore.getState().token;
    set({ auditLogsLoading: true, auditLogsError: null });
    try {
      const response = await seoService.listAuditLogs(params, token || undefined);
      if (response.success && response.data) {
        set({ auditLogs: response.data, auditLogsLoading: false });
      } else {
        set({ auditLogsError: response.error || 'Error fetching audit logs', auditLogsLoading: false });
      }
    } catch (error) {
      set({ auditLogsError: error instanceof Error ? error.message : 'Unknown error', auditLogsLoading: false });
    }
  },
  
  runAudit: async (entityType, entityId, locale) => {
    const token = useAuthStore.getState().token;
    set({ auditLogsLoading: true, auditLogsError: null });
    try {
      const response = await seoService.runAudit(entityType, entityId, locale, token || undefined);
      if (response.success && response.data) {
        set((state) => ({ 
          auditLogs: [response.data!, ...state.auditLogs], 
          auditLogsLoading: false 
        }));
      } else {
        set({ auditLogsError: response.error || 'Error running audit', auditLogsLoading: false });
      }
    } catch (error) {
      set({ auditLogsError: error instanceof Error ? error.message : 'Unknown error', auditLogsLoading: false });
    }
  },
  
  // Redirects actions
  fetchRedirects: async () => {
    const token = useAuthStore.getState().token;
    set({ redirectsLoading: true, redirectsError: null });
    try {
      const response = await seoService.listRedirects(token || undefined);
      if (response.success && response.data) {
        set({ redirects: response.data, redirectsLoading: false });
      } else {
        set({ redirectsError: response.error || 'Error fetching redirects', redirectsLoading: false });
      }
    } catch (error) {
      set({ redirectsError: error instanceof Error ? error.message : 'Unknown error', redirectsLoading: false });
    }
  },
  
  createRedirect: async (redirect) => {
    const token = useAuthStore.getState().token;
    set({ redirectsLoading: true, redirectsError: null });
    try {
      const response = await seoService.createRedirect(redirect, token || undefined);
      if (response.success && response.data) {
        set((state) => ({ 
          redirects: [...state.redirects, response.data!], 
          redirectsLoading: false 
        }));
      } else {
        set({ redirectsError: response.error || 'Error creating redirect', redirectsLoading: false });
      }
    } catch (error) {
      set({ redirectsError: error instanceof Error ? error.message : 'Unknown error', redirectsLoading: false });
    }
  },
  
  updateRedirect: async (id, redirect) => {
    const token = useAuthStore.getState().token;
    set({ redirectsLoading: true, redirectsError: null });
    try {
      const response = await seoService.updateRedirect(id, redirect, token || undefined);
      if (response.success && response.data) {
        set((state) => ({ 
          redirects: state.redirects.map((r) => r.id === id ? response.data! : r), 
          redirectsLoading: false 
        }));
      } else {
        set({ redirectsError: response.error || 'Error updating redirect', redirectsLoading: false });
      }
    } catch (error) {
      set({ redirectsError: error instanceof Error ? error.message : 'Unknown error', redirectsLoading: false });
    }
  },
  
  deleteRedirect: async (id) => {
    const token = useAuthStore.getState().token;
    set({ redirectsLoading: true, redirectsError: null });
    try {
      const response = await seoService.deleteRedirect(id, token || undefined);
      if (response.success) {
        set((state) => ({ 
          redirects: state.redirects.filter((r) => r.id !== id), 
          redirectsLoading: false 
        }));
      } else {
        set({ redirectsError: response.error || 'Error deleting redirect', redirectsLoading: false });
      }
    } catch (error) {
      set({ redirectsError: error instanceof Error ? error.message : 'Unknown error', redirectsLoading: false });
    }
  },
  
  // Sitemaps actions
  fetchSitemaps: async () => {
    const token = useAuthStore.getState().token;
    set({ sitemapsLoading: true, sitemapsError: null });
    try {
      const response = await seoService.listSitemaps(token || undefined);
      if (response.success && response.data) {
        set({ sitemaps: response.data, sitemapsLoading: false });
      } else {
        set({ sitemapsError: response.error || 'Error fetching sitemaps', sitemapsLoading: false });
      }
    } catch (error) {
      set({ sitemapsError: error instanceof Error ? error.message : 'Unknown error', sitemapsLoading: false });
    }
  },
  
  generateSitemap: async (section) => {
    const token = useAuthStore.getState().token;
    set({ sitemapsLoading: true, sitemapsError: null });
    try {
      const response = await seoService.generateSitemap(section, token || undefined);
      if (response.success) {
        // Refresh sitemaps after generation
        await seoService.listSitemaps(token || undefined).then((res) => {
          if (res.success && res.data) {
            set({ sitemaps: res.data, sitemapsLoading: false });
          }
        });
      } else {
        set({ sitemapsError: response.error || 'Error generating sitemap', sitemapsLoading: false });
      }
    } catch (error) {
      set({ sitemapsError: error instanceof Error ? error.message : 'Unknown error', sitemapsLoading: false });
    }
  },
  
  submitSitemap: async (section) => {
    const token = useAuthStore.getState().token;
    set({ sitemapsLoading: true, sitemapsError: null });
    try {
      const response = await seoService.submitSitemapToGoogle(section, token || undefined);
      if (response.success) {
        // Refresh sitemaps after submission
        await seoService.listSitemaps(token || undefined).then((res) => {
          if (res.success && res.data) {
            set({ sitemaps: res.data, sitemapsLoading: false });
          }
        });
      } else {
        set({ sitemapsError: response.error || 'Error submitting sitemap', sitemapsLoading: false });
      }
    } catch (error) {
      set({ sitemapsError: error instanceof Error ? error.message : 'Unknown error', sitemapsLoading: false });
    }
  },
}));
