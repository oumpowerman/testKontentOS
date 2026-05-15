
import { useWikiContext } from '../context/WikiContext';
import { WikiArticle, User } from '../types';

export const useWiki = (currentUser?: User) => {
    const context = useWikiContext();
    
    return {
        articles: context.articles,
        isLoading: context.isLoading,
        addArticle: (article: Omit<WikiArticle, 'id' | 'lastUpdated' | 'helpfulCount' | 'createdAt' | 'author' | 'lastEditor'>) => {
            if (!currentUser) return;
            return context.addArticle(article, currentUser);
        },
        updateArticle: (id: string, updates: Partial<WikiArticle>) => {
            if (!currentUser) return;
            return context.updateArticle(id, updates, currentUser);
        },
        deleteArticle: context.deleteArticle,
        toggleHelpful: context.toggleHelpful,
        fetchArticleDetail: context.fetchArticleDetail
    };
};
