package com.capitalfourge.portfoliomanager.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Asset {
    private String symbol;
    private String name;
    private String category;
    private String description;
    private String website;
    private String logo;
    private String sector;
    private String industry;
    private Float marketCap;
    private Float peRatio;
    private Float dividendYield;
    private Float beta;
    private Float week52High;
    private Float week52Low;
}