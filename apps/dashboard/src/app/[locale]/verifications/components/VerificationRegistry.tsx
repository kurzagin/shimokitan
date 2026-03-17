
"use client"

import RegistryTable from '@/components/RegistryTable';
import { deleteVerification, approveRoleUpgrade } from '../../actions';
import { Icon } from '@iconify/react';
import { toast } from 'sonner';

export default function VerificationRegistry({ data }: { data: any[] }) {
    return (
        <RegistryTable
            data={data}
            onDelete={deleteVerification}
            editUrl={(row) => `/verifications/${row.id}`}
            columns={[
                {
                    key: 'targetName', label: 'Target', render: (val, row) => (
                        <div>
                            <div className="font-bold text-white">{val}</div>
                            <div className="text-[9px] font-mono text-zinc-500 uppercase">{row.targetType} {'//'} {row.status}</div>
                        </div>
                    )
                },
                {
                    key: 'grantedBy', label: 'Auth_Status', render: (val, row) => {
                        if (row.targetType === 'role_upgrade' && row.status === 'pending') {
                            return (
                                <button
                                    onClick={async (e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        if (confirm('Approve this role upgrade?')) {
                                            const res = await approveRoleUpgrade(row.id);
                                            if (res.success) toast.success('Role_Upgraded: System permissions synced.');
                                        }
                                    }}
                                    className="flex items-center gap-1 bg-blue-600 text-black px-2 py-1 rounded text-[9px] font-black uppercase hover:bg-white transition-all"
                                >
                                    <Icon icon="lucide:check-circle" width={10} />
                                    APPROVE
                                </button>
                            );
                        }
                        return <span className="text-blue-400 font-mono text-[10px] uppercase">{val || 'Awaiting_Action'}</span>;
                    }
                },
                { key: 'createdAt', label: 'Date', render: (val) => <span className="text-[10px] font-mono text-zinc-500">{new Date(val).toLocaleDateString()}</span> },
                { key: 'r2Key', label: 'Manifest_ID', render: (val) => <span className="text-[9px] font-mono text-zinc-600 truncate max-w-[100px] block">{val || 'N/A'}</span> },
            ]}
        />
    );
}
