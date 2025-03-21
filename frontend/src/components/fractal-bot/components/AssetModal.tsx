import React from 'react';
import { Asset } from '../types/state';
import { getAssetIcon, getAssetColor } from './AssetsSection';

interface AssetModalProps {
    asset: Asset;
    onClose: () => void;
}

export const AssetModal: React.FC<AssetModalProps> = ({ asset, onClose }) => {
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
                            <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full sm:mx-0 sm:h-10 sm:w-10 ${getAssetColor(asset.type, asset.metadata)}`}>
                                {getAssetIcon(asset.type, asset.metadata)}
                                {asset.metadata.status === 'in_progress' && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="absolute w-full h-full rounded-full animate-pulse bg-current opacity-20"></div>
                                        <svg className="absolute w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    </div>
                                )}
                            </div>

                            {/* Content */}
                            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
                                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100" id="modal-title">
                                    {asset.name}
                                    {asset.metadata.status === 'in_progress' && (
                                        <span className="ml-2 text-sm text-blue-500 dark:text-blue-400">• Processing</span>
                                    )}
                                </h3>
                                <div className="mt-2">
                                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
                                        <span>{asset.type}</span>
                                        <span>•</span>
                                        <span>{new Date(asset.metadata.timestamp).toLocaleString()}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1 mb-4">
                                        {asset.metadata.tags?.map((tag, index) => (
                                            <span
                                                key={index}
                                                className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 
                                                         dark:text-gray-400 rounded-full"
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="prose dark:prose-invert max-w-none">
                                        <pre className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                                            {typeof asset.content === 'string'
                                                ? asset.content
                                                : JSON.stringify(asset.content, null, 2)
                                            }
                                        </pre>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                        <button
                            type="button"
                            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600
                                     shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300
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