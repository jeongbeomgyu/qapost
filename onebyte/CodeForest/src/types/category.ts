export type SubCategory = {
    id: number;
    name: string;
    order: number;
    isActive?: boolean;
  };
  
  export type Category = {
    id: number;
    name: string;
    order: number;
    isActive?: boolean;
    subcategories: SubCategory[];
  };
  