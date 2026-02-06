package com.finsight.portfoliomanager.infrastructure.adapters.in.graphql;

import java.util.List;
import java.util.UUID;

import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;

import com.finsight.portfoliomanager.application.ports.dto.auth.AuthResult;
import com.finsight.portfoliomanager.application.ports.dto.auth.LoginCommand;
import com.finsight.portfoliomanager.application.ports.in.UserUseCase;
import com.finsight.portfoliomanager.domain.User;
import com.finsight.portfoliomanager.infrastructure.grpc.GrpcFinancialDataClient;
import com.finsight.proto.PricePoint;
import com.finsight.proto.StockPriceResponse;

import lombok.RequiredArgsConstructor;

@Controller
@RequiredArgsConstructor
public class PortfolioGraphQLController {

    private final GrpcFinancialDataClient grpcClient;
    private final UserUseCase userUseCase;

    @QueryMapping
    public User me(@AuthenticationPrincipal UUID userId) {

        if (userId == null) {
            return null;
        }

        return User.builder()
                .id(userId)
                .username("Usuario_Detectado")
                .email("token@valido.com")
                .build();
    }

    @QueryMapping
    public StockPriceResponse stockPrice(@Argument String symbol) {
        double price = grpcClient.getStockPrice(symbol);
        return StockPriceResponse.newBuilder()
                .setSymbol(symbol)
                .setPrice(price)
                .build();
    }

    @MutationMapping
    public AuthResult login(@Argument String email, @Argument String password) {
        return userUseCase.login(new LoginCommand(email, password));
    }

    @QueryMapping
    public List<PricePoint> priceHistory(@Argument String symbol, @Argument int days) {
        return grpcClient.getPriceHistory(symbol, days);
    }
}
