"use client"

import MilvusDocumentManager from "@/components/milvus-document-manager"
import { AdminRouteProtection } from "@/components/admin-route-protection"

export default function KnowledgeBasePage() {
  return (
    <AdminRouteProtection>
      <div className="container mx-auto space-y-4">
        <MilvusDocumentManager 
          title="Knowledge Base - Vector Search"
          apiBaseUrl={process.env.NEXT_PUBLIC_MILVUS_API_URL}
        />
      </div>
    </AdminRouteProtection>
  )
}
