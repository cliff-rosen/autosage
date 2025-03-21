import React, { useState, useRef } from 'react';
import { Asset } from '../types/state';

interface AssetsSectionProps {
    assets: Asset[];
}

const getAssetIcon = (type: string) => {
    switch (type) {
        case 'data':
            return (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                </svg>
            );
        case 'analysis':
            return (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            );
        default:
            return (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            );
    }
};

export const AssetsSection: React.FC<AssetsSectionProps> = ({ assets }) => {
    const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
    const [previewAsset, setPreviewAsset] = useState<{ asset: Asset; position: { x: number; y: number } } | null>(null);

    const handleMouseEnter = (asset: Asset, event: React.MouseEvent) => {
        const rect = event.currentTarget.getBoundingClientRect();
        setPreviewAsset({
            asset,
            position: {
                x: rect.right,
                y: rect.top
            }
        });
    };

    const handleMouseLeave = () => {
        setPreviewAsset(null);
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex-none p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Assets
                </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                <div className="grid grid-cols-1 gap-3">
                    {assets.map(asset => (
                        <div
                            key={asset.id}
                            className="group relative bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 
                                     hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-md transition-all duration-200 p-3"
                            onMouseEnter={(e) => handleMouseEnter(asset, e)}
                            onMouseLeave={handleMouseLeave}
                            onClick={() => setSelectedAsset(asset)}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center
                                              ${asset.type === 'data' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' :
                                        asset.type === 'analysis' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                                            'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}`}>
                                    {getAssetIcon(asset.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h5 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                        {asset.name}
                                    </h5>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {asset.type} • {new Date(asset.metadata.timestamp).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Asset Preview */}
            {previewAsset && (
                <div
                    className="fixed z-50 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 
                              animate-fade-in pointer-events-none"
                    style={{
                        left: `${previewAsset.position.x + 16}px`,
                        top: `${previewAsset.position.y}px`,
                        maxHeight: '400px',
                        overflow: 'hidden'
                    }}
                >
                    <div className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                            <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center
                                          ${previewAsset.asset.type === 'data' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' :
                                    previewAsset.asset.type === 'analysis' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                                        'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}`}>
                                {getAssetIcon(previewAsset.asset.type)}
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                    {previewAsset.asset.name}
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {previewAsset.asset.type} • {new Date(previewAsset.asset.metadata.timestamp).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300 overflow-hidden">
                            <pre className="whitespace-pre-wrap">
                                {typeof previewAsset.asset.content === 'string'
                                    ? previewAsset.asset.content
                                    : JSON.stringify(previewAsset.asset.content, null, 2)
                                }
                            </pre>
                        </div>
                    </div>
                </div>
            )}

            {/* Asset Modal */}
            {selectedAsset && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
                        <div className="flex-none p-4 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                    {selectedAsset.name}
                                </h3>
                                <button
                                    onClick={() => setSelectedAsset(null)}
                                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4">
                            <pre className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                                {typeof selectedAsset.content === 'string'
                                    ? selectedAsset.content
                                    : JSON.stringify(selectedAsset.content, null, 2)
                                }
                            </pre>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}; 