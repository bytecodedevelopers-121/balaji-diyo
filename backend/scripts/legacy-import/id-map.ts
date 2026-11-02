// Maps a legacy numeric id to the new Prisma cuid, namespaced by a semantic
// entity key (not the raw legacy table name) so polymorphic owner resolution
// (Attachment/Meta/UrlInfo ownerType) and cross-phase FKs can share one lookup
// vocabulary. See owner-map.ts for the FQCN -> namespace mapping.
export class IdMap {
  private maps = new Map<string, Map<number, string>>();

  set(namespace: string, legacyId: number, newId: string): void {
    if (!this.maps.has(namespace)) this.maps.set(namespace, new Map());
    this.maps.get(namespace)!.set(legacyId, newId);
  }

  get(namespace: string, legacyId: number): string | undefined {
    return this.maps.get(namespace)?.get(legacyId);
  }

  getRequired(namespace: string, legacyId: number, context: string): string {
    const id = this.get(namespace, legacyId);
    if (!id) {
      throw new Error(
        `id-map miss: no new id for ${namespace}#${legacyId} (needed by ${context})`,
      );
    }
    return id;
  }
}

export const idMap = new IdMap();
