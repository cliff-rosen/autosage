import React from 'react';
import { InformationAsset } from '../types/state';

interface AssetModalProps {
    asset: InformationAsset | null;
    onClose: () => void;
}

export const AssetModal: React.FC<AssetModalProps> = ({ asset, onClose }) => {
    if (!asset) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                {/* Background overlay */}
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75 transition-opacity"
                    aria-hidden="true"
                    onClick={onClose}
                />

                {/* Modal panel */}
                <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl 
                              transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
                    <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="sm:flex sm:items-start">
                            {/* Icon */}
                            <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full sm:mx-0 sm:h-10 sm:w-10
                                          ${asset.type === 'data' ? 'bg-purple-100 dark:bg-purple-900/30' :
                                    asset.type === 'analysis_output' ? 'bg-blue-100 dark:bg-blue-900/30' :
                                        'bg-gray-100 dark:bg-gray-700'}`}>
                                <svg className={`h-6 w-6 ${asset.type === 'data' ? 'text-purple-600 dark:text-purple-400' :
                                    asset.type === 'analysis_output' ? 'text-blue-600 dark:text-blue-400' :
                                        'text-gray-600 dark:text-gray-400'}`}
                                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    {asset.type === 'data' ? (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    ) : asset.type === 'analysis_output' ? (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    ) : (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                    )}
                                </svg>
                            </div>

                            {/* Content */}
                            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
                                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100" id="modal-title">
                                    {asset.name || asset.title}
                                </h3>
                                <div className="mt-2">
                                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
                                        <span>{asset.type}</span>
                                        <span>•</span>
                                        <span>{new Date(asset.metadata.timestamp).toLocaleString()}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1 mb-4">
                                        {asset.metadata.tags.map((tag, index) => (
                                            <span
                                                key={index}
                                                className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 
                                                         dark:text-gray-400 rounded-full"
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 max-h-[60vh] overflow-y-auto">
                                        {Array.isArray(asset.content) ? (
                                            <ul className="list-disc list-inside space-y-2">
                                                {asset.content.map((item, index) => (
                                                    <li key={index} className="text-sm text-gray-600 dark:text-gray-300">
                                                        {item}
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : typeof asset.content === 'object' ? (
                                            <pre className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                                                {JSON.stringify(asset.content, null, 2)}
                                            </pre>
                                        ) : (
                                            <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                                                {asset.content}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                        <button
                            type="button"
                            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600
                                     shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-200
                                     hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2
                                     focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                            onClick={onClose}
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}; 