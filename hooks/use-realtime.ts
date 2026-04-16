"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase-client"
import type { RealtimeChannel } from "@supabase/supabase-js"
import type { Product, Sale } from "@/lib/types"

export function useRealtime(channelName: string = "db-changes") {
  const [products, setProducts] = useState<Product[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const channel: RealtimeChannel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setProducts((prev) => [payload.new as Product, ...prev])
          } else if (payload.eventType === "UPDATE") {
            setProducts((prev) =>
              prev.map((p) =>
                p.id === payload.new.id ? (payload.new as Product) : p
              )
            )
          } else if (payload.eventType === "DELETE") {
            setProducts((prev) => prev.filter((p) => p.id !== payload.old.id))
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sales" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setSales((prev) => [payload.new as Sale, ...prev])
          } else if (payload.eventType === "UPDATE") {
            setSales((prev) =>
              prev.map((s) =>
                s.id === payload.new.id ? (payload.new as Sale) : s
              )
            )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [channelName])

  return { products, sales, loading }
}
