package auth

import (
	"fmt"

	"github.com/golang-jwt/jwt/v5"
)

func ValidateToke(tokenString string, secret string) (string, error) {
	jwtSecret := []byte(secret)

	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
                return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return jwtSecret, nil
	})
      
	if err != nil {
		return "", err
	}

	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		userId, ok := claims["id"].(string)
		if 	!ok {
			return "", fmt.Errorf("id claim is missing or not a string")
		}
		return userId, nil
	}

	return "", fmt.Errorf("invalid token")
}